import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

const HTTP_ERROR_TRANSLATIONS: Record<string, string> = {
  'Bad Request': 'Requisição inválida',
  Unauthorized: 'Não autorizado',
  Forbidden: 'Acesso negado',
  'Not Found': 'Não encontrado',
  Conflict: 'Conflito',
  'Unprocessable Entity': 'Entidade não processável',
  'Too Many Requests': 'Muitas requisições',
  'Internal Server Error': 'Erro interno do servidor',
  'Service Unavailable': 'Serviço indisponível',
};

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const isObject = typeof exceptionResponse === 'object';

    const rawMessage = isObject && 'message' in exceptionResponse
      ? (exceptionResponse as Record<string, unknown>).message
      : exceptionResponse;

    const errorLabel = isObject && 'error' in exceptionResponse
      ? (exceptionResponse as Record<string, string>).error
      : '';

    const message =
      typeof rawMessage === 'string'
        ? (HTTP_ERROR_TRANSLATIONS[rawMessage] ?? rawMessage)
        : rawMessage;

    response.status(status).json({
      statusCode: status,
      error: HTTP_ERROR_TRANSLATIONS[errorLabel] ?? errorLabel,
      message,
    });
  }
}
