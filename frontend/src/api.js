import { auth } from './firebase';


export const authenticatedFetch = async (input, init = {}) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Authentication is required.');
  }

  const token = await user.getIdToken();
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(input, {
    ...init,
    headers
  });
};
