import { type Location } from '../../services/api';

export type MapPoint = Location & {
  status: 'critical' | 'warning' | 'good';
  lat: number;
  lng: number;
};
