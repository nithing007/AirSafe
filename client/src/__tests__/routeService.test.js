import { describe, it, expect } from 'vitest';
import { routeService } from '../services/routeService';

describe('routeService', () => {
  it('throws an error if origin or destination coordinates are missing', async () => {
    await expect(
      routeService.compareRoutes({
        origin: 'City A',
        destination: 'City B',
      })
    ).rejects.toThrow(/valid resolved coordinates/i);

    await expect(
      routeService.compareRoutes({
        origin: 'City A',
        destination: 'City B',
        originCoords: { latitude: 11.0 },
      })
    ).rejects.toThrow(/valid resolved coordinates/i);
  });

  it('successfully computes routes between valid coordinates', async () => {
    const res = await routeService.compareRoutes({
      origin: 'Delhi',
      destination: 'Noida',
      originCoords: { latitude: 28.6139, longitude: 77.2090 },
      destinationCoords: { latitude: 28.6258, longitude: 77.3673 },
    });

    expect(res).toHaveProperty('data');
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(2);

    const greenRoute = res.data.find((r) => r.isRecommended);
    const directRoute = res.data.find((r) => !r.isRecommended);

    expect(greenRoute).toBeDefined();
    expect(directRoute).toBeDefined();
    expect(greenRoute.color).toBe('#10b981');
    expect(directRoute.color).toBe('#ef4444');
    expect(greenRoute.estimatedExposureScore).toBeLessThan(directRoute.estimatedExposureScore);

    // Verify coordinates start at origin and end at destination
    const coords = greenRoute.coordinates;
    expect(coords[0][0]).toBeCloseTo(28.6139, 3);
    expect(coords[0][1]).toBeCloseTo(77.2090, 3);
    expect(coords[coords.length - 1][0]).toBeCloseTo(28.6258, 3);
    expect(coords[coords.length - 1][1]).toBeCloseTo(77.3673, 3);

    // Verify disclaimer is present
    expect(greenRoute).toHaveProperty('disclaimer');
  });

  it('uses rich demo routes when selecting default Coimbatore points', async () => {
    const res = await routeService.compareRoutes({
      origin: 'Gandhipuram',
      destination: 'Saravanampatti',
      originCoords: { latitude: 11.0168, longitude: 76.9558 },
      destinationCoords: { latitude: 11.0420, longitude: 76.9800 },
    });

    expect(res.isDemo).toBe(true);
    expect(res.data.length).toBe(2);
  });
});
