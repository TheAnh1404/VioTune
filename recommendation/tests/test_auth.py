import os
import unittest
from unittest.mock import patch

from fastapi import HTTPException

from api.auth import require_admin, require_matching_user, verify_firebase_id_token


class FirebaseAuthTests(unittest.TestCase):
    def setUp(self):
        self.project_id = "viotune-test"
        self.previous_project_id = os.environ.get("FIREBASE_PROJECT_ID")
        os.environ["FIREBASE_PROJECT_ID"] = self.project_id

    def tearDown(self):
        if self.previous_project_id is None:
            os.environ.pop("FIREBASE_PROJECT_ID", None)
        else:
            os.environ["FIREBASE_PROJECT_ID"] = self.previous_project_id

    @patch("api.auth.id_token.verify_firebase_token")
    def test_verifies_valid_firebase_token(self, verify_token):
        verify_token.return_value = {
            "sub": "user-123",
            "iss": f"https://securetoken.google.com/{self.project_id}",
            "email": "user@example.com",
        }

        claims = verify_firebase_id_token("valid-token")

        self.assertEqual(claims["sub"], "user-123")
        verify_token.assert_called_once()

    @patch("api.auth.id_token.verify_firebase_token")
    def test_rejects_wrong_issuer(self, verify_token):
        verify_token.return_value = {
            "sub": "user-123",
            "iss": "https://securetoken.google.com/another-project",
        }

        with self.assertRaises(HTTPException) as context:
            verify_firebase_id_token("wrong-project-token")

        self.assertEqual(context.exception.status_code, 401)

    def test_rejects_access_to_another_user(self):
        with self.assertRaises(HTTPException) as context:
            require_matching_user("other-user", {"sub": "current-user"})

        self.assertEqual(context.exception.status_code, 403)

    def test_requires_admin_claim(self):
        with self.assertRaises(HTTPException) as context:
            require_admin({"sub": "current-user"})

        self.assertEqual(context.exception.status_code, 403)
        self.assertEqual(require_admin({"sub": "admin-user", "admin": True})["sub"], "admin-user")


if __name__ == "__main__":
    unittest.main()
