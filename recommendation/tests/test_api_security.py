import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from api.app import app
from api.auth import get_current_user


class ApiSecurityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_health_endpoints_are_public(self):
        self.assertEqual(self.client.get("/health/live").status_code, 200)
        self.assertEqual(self.client.get("/health/ready").status_code, 200)

    def test_private_endpoint_requires_token(self):
        response = self.client.get("/songs/liked", params={"user_id": "user-1"})

        self.assertEqual(response.status_code, 401)

    def test_user_cannot_read_another_users_data(self):
        app.dependency_overrides[get_current_user] = lambda: {"sub": "user-1"}

        response = self.client.get("/songs/liked", params={"user_id": "user-2"})

        self.assertEqual(response.status_code, 403)

    def test_retrain_requires_admin_claim(self):
        app.dependency_overrides[get_current_user] = lambda: {"sub": "user-1"}

        response = self.client.post("/recommend/retrain")

        self.assertEqual(response.status_code, 403)

    def test_user_cannot_create_playlist_for_another_user(self):
        app.dependency_overrides[get_current_user] = lambda: {"sub": "user-1"}

        response = self.client.post(
            "/playlists",
            json={"user_id": "user-2", "name": "Not mine"},
        )

        self.assertEqual(response.status_code, 403)

    @patch("api.routers.playlists.fdb.get_document")
    def test_user_cannot_mutate_another_users_playlist(self, get_document):
        get_document.return_value = {"playlist_id": "playlist-1", "user_id": "user-2"}
        app.dependency_overrides[get_current_user] = lambda: {"sub": "user-1"}

        response = self.client.delete("/playlists/playlist-1/songs/track-1")

        self.assertEqual(response.status_code, 403)

    def test_genre_and_user_playlist_routes_are_distinct(self):
        paths = {route.path for route in app.routes}

        self.assertIn("/genres/{genre}/songs", paths)
        self.assertIn("/playlists/{playlist_id}/songs", paths)


if __name__ == "__main__":
    unittest.main()
