import os
import requests
from typing import List, Dict, Any, Optional

from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from google.oauth2 import service_account

# Load Firebase configuration
PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
API_KEY = os.getenv("FIREBASE_API_KEY", "")

BASE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"


def _create_admin_client():
    use_admin_sdk = os.getenv("FIREBASE_USE_ADMIN_SDK", "").lower() == "true"
    credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    environment = os.getenv("ENVIRONMENT", "development").lower()

    if (credentials_path or use_admin_sdk or environment == "production") and not PROJECT_ID:
        raise RuntimeError("FIREBASE_PROJECT_ID is required.")

    if credentials_path:
        credentials = service_account.Credentials.from_service_account_file(credentials_path)
        return firestore.Client(project=PROJECT_ID, credentials=credentials)

    if use_admin_sdk:
        return firestore.Client(project=PROJECT_ID)

    if environment == "production":
        raise RuntimeError("Production requires Firebase Admin SDK credentials.")

    print("[Firestore] Development REST fallback enabled. Do not use this mode in production.")
    return None


ADMIN_CLIENT = _create_admin_client()

def _get_url(path: str) -> str:
    url = f"{BASE_URL}/{path}"
    if API_KEY:
        url += f"?key={API_KEY}"
    return url

# ===== FIRESTORE TYPE CONVERTERS =====

def to_firestore_value(val: Any) -> Dict[str, Any]:
    if isinstance(val, bool):
        return {"booleanValue": val}
    elif isinstance(val, int):
        return {"integerValue": str(val)}
    elif isinstance(val, float):
        return {"doubleValue": val}
    elif isinstance(val, str):
        return {"stringValue": val}
    elif isinstance(val, list):
        return {"arrayValue": {"values": [to_firestore_value(x) for x in val]}}
    elif isinstance(val, dict):
        return {"mapValue": {"fields": {k: to_firestore_value(v) for k, v in val.items()}}}
    elif val is None:
        return {"nullValue": None}
    else:
        return {"stringValue": str(val)}

def from_firestore_value(fval: Dict[str, Any]) -> Any:
    if not isinstance(fval, dict):
        return fval
    if "stringValue" in fval:
        return fval["stringValue"]
    elif "integerValue" in fval:
        return int(fval["integerValue"])
    elif "doubleValue" in fval:
        return float(fval["doubleValue"])
    elif "booleanValue" in fval:
        return fval["booleanValue"]
    elif "arrayValue" in fval:
        vals = fval["arrayValue"].get("values", [])
        return [from_firestore_value(v) for v in vals]
    elif "mapValue" in fval:
        fields = fval["mapValue"].get("fields", {})
        return {k: from_firestore_value(v) for k, v in fields.items()}
    elif "nullValue" in fval:
        return None
    return fval

def to_firestore_doc(py_dict: Dict[str, Any]) -> Dict[str, Any]:
    return {"fields": {k: to_firestore_value(v) for k, v in py_dict.items() if v is not None}}

def from_firestore_doc(f_doc: Dict[str, Any]) -> Dict[str, Any]:
    fields = f_doc.get("fields", {})
    # Extract doc_id from name: "projects/.../databases/(default)/documents/{collection}/{doc_id}"
    name = f_doc.get("name", "")
    doc_id = name.split("/")[-1] if name else None
    
    res = {k: from_firestore_value(v) for k, v in fields.items()}
    if doc_id:
        res["id"] = doc_id
    return res

# ===== FIRESTORE CRUD OPERATIONS =====

def get_document(collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a document from Firestore. Returns None if 404."""
    if ADMIN_CLIENT:
        snapshot = ADMIN_CLIENT.collection(collection).document(doc_id).get()
        if not snapshot.exists:
            return None
        return {**snapshot.to_dict(), "id": snapshot.id}

    url = _get_url(f"{collection}/{doc_id}")
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            return from_firestore_doc(resp.json())
        elif resp.status_code == 404:
            return None
        else:
            print(f"[Firestore GET Error] Status: {resp.status_code}, Body: {resp.text}")
            return None
    except Exception as e:
        print(f"[Firestore GET Exception] {e}")
        return None

def set_document(collection: str, doc_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Upserts a document to Firestore using PATCH."""
    if ADMIN_CLIENT:
        ADMIN_CLIENT.collection(collection).document(doc_id).set(data, merge=True)
        return {**data, "id": doc_id}

    url = _get_url(f"{collection}/{doc_id}")
    payload = to_firestore_doc(data)
    try:
        resp = requests.patch(url, json=payload, timeout=10)
        if resp.status_code == 200:
            return from_firestore_doc(resp.json())
        else:
            print(f"[Firestore PATCH Error] Status: {resp.status_code}, Body: {resp.text}")
            return None
    except Exception as e:
        print(f"[Firestore PATCH Exception] {e}")
        return None

def delete_document(collection: str, doc_id: str) -> bool:
    """Deletes a document from Firestore. Returns True if successful."""
    if ADMIN_CLIENT:
        ADMIN_CLIENT.collection(collection).document(doc_id).delete()
        return True

    url = _get_url(f"{collection}/{doc_id}")
    try:
        resp = requests.delete(url, timeout=10)
        if resp.status_code == 200:
            return True
        else:
            print(f"[Firestore DELETE Error] Status: {resp.status_code}, Body: {resp.text}")
            return False
    except Exception as e:
        print(f"[Firestore DELETE Exception] {e}")
        return False

def query_documents(
    collection: str, 
    filters: Optional[Dict[str, Any]] = None, 
    order_by: Optional[str] = None, 
    direction: str = "ASCENDING", 
    limit: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Queries Firestore collection using :runQuery."""
    if ADMIN_CLIENT:
        query = ADMIN_CLIENT.collection(collection)
        for key, value in (filters or {}).items():
            query = query.where(filter=FieldFilter(key, "==", value))
        if order_by:
            order_direction = (
                firestore.Query.DESCENDING
                if direction == "DESCENDING"
                else firestore.Query.ASCENDING
            )
            query = query.order_by(order_by, direction=order_direction)
        if limit:
            query = query.limit(limit)
        return [{**snapshot.to_dict(), "id": snapshot.id} for snapshot in query.stream()]

    url = f"{BASE_URL}:runQuery"
    if API_KEY:
        url += f"?key={API_KEY}"
        
    query = {
        "from": [{"collectionId": collection}]
    }
    
    if filters:
        if len(filters) == 1:
            k, v = list(filters.items())[0]
            query["where"] = {
                "fieldFilter": {
                    "field": {"fieldPath": k},
                    "op": "EQUAL",
                    "value": to_firestore_value(v)
                }
            }
        else:
            query["where"] = {
                "compositeFilter": {
                    "op": "AND",
                    "filters": [
                        {
                            "fieldFilter": {
                                "field": {"fieldPath": k},
                                "op": "EQUAL",
                                "value": to_firestore_value(v)
                            }
                        } for k, v in filters.items()
                    ]
                }
            }
            
    if order_by:
        query["orderBy"] = [
            {
                "field": {"fieldPath": order_by},
                "direction": direction
            }
        ]
        
    if limit:
        query["limit"] = limit
        
    payload = {"structuredQuery": query}
    
    try:
        resp = requests.post(url, json=payload, timeout=10)
        if resp.status_code != 200:
            print(f"[Firestore runQuery Error] Status: {resp.status_code}, Body: {resp.text}")
            return []
            
        results = resp.json()
        docs = []
        for res in results:
            doc = res.get("document")
            if doc:
                docs.append(from_firestore_doc(doc))
        return docs
    except Exception as e:
        print(f"[Firestore runQuery Exception] {e}")
        return []
