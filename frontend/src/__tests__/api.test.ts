import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import {
  alertsApi,
  healthApi,
  locationsApi,
  waterQualityApi,
} from '../services/api';

const axiosMocks = vi.hoisted(() => {
  const get = vi.fn();
  const requestHandlers: { success?: (config: unknown) => unknown } = {};
  const responseHandlers: { error?: (error: unknown) => Promise<never> } = {};
  const responseUse = vi.fn((_success, error) => {
    responseHandlers.error = error;
  });
  const requestUse = vi.fn((success) => {
    requestHandlers.success = success;
  });
  const create = vi.fn(() => ({
    get,
    interceptors: {
      request: { use: requestUse },
      response: { use: responseUse },
    },
  }));
  return {
    get,
    requestUse,
    responseUse,
    requestHandlers,
    responseHandlers,
    create,
  };
});

vi.mock('axios', () => ({
  default: { create: axiosMocks.create },
  create: axiosMocks.create,
}));

beforeEach(() => {
  axiosMocks.get.mockReset();
  axiosMocks.create.mockClear();
  axiosMocks.requestUse.mockClear();
  axiosMocks.responseUse.mockClear();
  axiosMocks.get.mockResolvedValue({ data: {} });
});

describe('api client', () => {
  it('initializes axios with base config', async () => {
    axiosMocks.create.mockClear();
    await vi.resetModules();
    await import('../services/api');
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: expect.stringContaining('/api'),
        headers: { 'Content-Type': 'application/json' },
        timeout: 90000,
      })
    );
  });

  it('calls locations list endpoint', async () => {
    axiosMocks.get.mockResolvedValueOnce({ data: { success: true, data: [] } });
    await locationsApi.getAll({ limit: 5, offset: 0 });
    expect(axiosMocks.get).toHaveBeenCalledWith('/locations', {
      params: { limit: 5, offset: 0 },
    });
  });

  it('calls alerts stats endpoint', async () => {
    axiosMocks.get.mockResolvedValueOnce({ data: { success: true, data: {} } });
    await alertsApi.getStats({ start_date: '2026-01-01' });
    expect(axiosMocks.get).toHaveBeenCalledWith('/alerts/stats', {
      params: { start_date: '2026-01-01' },
    });
  });

  it('calls water quality readings endpoint', async () => {
    axiosMocks.get.mockResolvedValueOnce({ data: { success: true, data: [] } });
    await waterQualityApi.getReadings({ state: 'Delhi' });
    expect(axiosMocks.get).toHaveBeenCalledWith('/water-quality', {
      params: { state: 'Delhi' },
    });
  });

  it('calls health endpoint', async () => {
    axiosMocks.get.mockResolvedValueOnce({ data: { ok: true } });
    await healthApi.check();
    expect(axiosMocks.get).toHaveBeenCalledWith('/health');
  });

  it('formats 429 errors via interceptor', async () => {
    const error = { response: { status: 429 } };
    const responseErrorHandler = axiosMocks.responseHandlers.error;
    if (!responseErrorHandler) {
      throw new Error('Missing response error handler');
    }
    await expect(responseErrorHandler(error)).rejects.toMatchObject({
      message: 'Too many requests (429). Please wait a moment and try again.',
    });
  });

  it('handles network errors without response', async () => {
    const error = { message: 'Network Error', code: 'ERR_NETWORK' };
    const responseErrorHandler = axiosMocks.responseHandlers.error;
    if (!responseErrorHandler) {
      throw new Error('Missing response error handler');
    }
    await expect(responseErrorHandler(error)).rejects.toMatchObject({
      message: 'Network Error',
    });
  });

  it('formats 400 validation errors via interceptor', async () => {
    const error = {
      response: {
        status: 400,
        data: {
          error: 'Validation failed',
          details: [{ field: 'name', message: 'Required' }],
        },
      },
    };
    const responseErrorHandler = axiosMocks.responseHandlers.error;
    if (!responseErrorHandler) {
      throw new Error('Missing response error handler');
    }
    await expect(responseErrorHandler(error)).rejects.toMatchObject({
      message: 'Validation failed: name: Required',
    });
  });

  it('formats multiple validation details via interceptor', async () => {
    const error = {
      response: {
        status: 400,
        data: {
          error: 'Validation failed',
          details: [
            { field: 'name', message: 'Required' },
            { field: 'email', message: 'Invalid format' },
          ],
        },
      },
    };
    const responseErrorHandler = axiosMocks.responseHandlers.error;
    if (!responseErrorHandler) {
      throw new Error('Missing response error handler');
    }
    await expect(responseErrorHandler(error)).rejects.toMatchObject({
      message: 'Validation failed: name: Required, email: Invalid format',
    });
  });
});
