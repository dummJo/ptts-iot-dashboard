import { cookies } from 'next/headers';
import { verifySession } from './session';
import { ApiResponse } from './api-response';

export async function requireAuth(requiredRole?: string): Promise<
  { authenticated: true; username: string; role: string } |
  { authenticated: false; response: ReturnType<typeof ApiResponse.unauthorized> }
> {
  const jar = await cookies();
  const token = jar.get('ptts-session')?.value;

  if (!token) {
    return { authenticated: false, response: ApiResponse.unauthorized() };
  }

  const session = await verifySession(token);
  if (!session) {
    return { authenticated: false, response: ApiResponse.unauthorized('Invalid session') };
  }

  const username = session.username as string;
  const role = session.role as string;

  if (requiredRole && role !== requiredRole) {
    return { authenticated: false, response: ApiResponse.unauthorized(`${requiredRole} access required`) };
  }

  return { authenticated: true, username, role };
}
