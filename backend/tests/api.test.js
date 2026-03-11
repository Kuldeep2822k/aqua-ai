const request = require('supertest');

// Mock Supabase
jest.mock('../src/db/supabase', () => {
  const mockFrom = jest.fn().mockReturnThis();
  const mockSelect = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockSingle = jest.fn().mockImplementation(() => ({
    data: { id: 1, name: 'Test Location', station_code: 'ST-001' },
    error: null
  }));
  const mockOrder = jest.fn().mockReturnThis();
  const mockLimit = jest.fn().mockReturnThis();
  const mockRange = jest.fn().mockReturnThis();

  return {
    supabase: {
      from: mockFrom,
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
      order: mockOrder,
      limit: mockLimit,
      range: mockRange
    }
  };
});

// Mock other middlewares and utils
jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
  authorize: () => (req, res, next) => next(),
}));

jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
}));

const app = require('../src/server');
const { supabase } = require('../src/db/supabase');

describe('API Integration: Live Monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/locations/:id', () => {
    it('should include station_code in location details', async () => {
      const res = await request(app).get('/api/locations/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.station_code).toBe('ST-001');
      expect(supabase.from).toHaveBeenCalledWith('locations');
    });
  });

  describe('GET /api/water-quality', () => {
    it('should select external_id and raw_data', async () => {
      // Mock data return for water-quality
      supabase.from().select.mockReturnValueOnce({
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [{ 
            id: 1, 
            external_id: 'ext-123', 
            raw_data: { foo: 'bar' },
            locations: { name: 'Test' },
            water_quality_parameters: { parameter_code: 'BOD' }
          }],
          count: 1,
          error: null
        })
      });

      const res = await request(app).get('/api/water-quality');

      expect(res.status).toBe(200);
      expect(supabase.from).toHaveBeenCalledWith('water_quality_readings');
      // The code selects external_id and raw_data in the query string
      const selectCall = supabase.from().select.mock.calls[0][0];
      expect(selectCall).toContain('external_id');
      expect(selectCall).toContain('raw_data');
    });
  });
});
