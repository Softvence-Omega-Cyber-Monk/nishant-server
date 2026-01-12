import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    // Support both `role` (string) and `roles` (array or string) on the user object.
    const rawUserRoles: any = Array.isArray(user.roles)
      ? user.roles
      : user.roles || user.role || [];

    const userRoles: string[] = Array.isArray(rawUserRoles)
      ? rawUserRoles.map((r) => String(r).toUpperCase())
      : [String(rawUserRoles).toUpperCase()];

    const roleSet = new Set(userRoles);
  
    return requiredRoles
      .map((r) => String(r).toUpperCase())
      .some((r) => roleSet.has(r));
  }
}
