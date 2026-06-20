import { authenticatedFetch } from './api';
import { auth } from './firebase';


jest.mock('./firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('firebase-id-token')
    }
  }
}));


test('adds the Firebase ID token to authenticated requests', async () => {
  const response = { ok: true };
  auth.currentUser.getIdToken.mockResolvedValue('firebase-id-token');
  global.fetch = jest.fn().mockResolvedValue(response);

  const result = await authenticatedFetch('/private', {
    headers: { 'Content-Type': 'application/json' }
  });

  expect(result).toBe(response);
  expect(global.fetch).toHaveBeenCalledWith('/private', expect.objectContaining({
    headers: expect.any(Headers)
  }));

  const [, request] = global.fetch.mock.calls[0];
  expect(request.headers.get('Authorization')).toBe('Bearer firebase-id-token');
  expect(request.headers.get('Content-Type')).toBe('application/json');
});
