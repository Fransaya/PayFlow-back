import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // Si se pasa un parámetro, retorna esa propiedad específica del request
    if (data) {
      return request[data];
    }

    // Por defecto retorna request.user
    return request.user;
  },
);
