import test from 'node:test';
import assert from 'node:assert/strict';
import { referenceMap } from '../src/providers/earthquake-map.ts';
import { parseEarthquakes } from '../src/providers/earthquakes.ts';

test('centro y epicentro: norte arriba, este a derecha y coincidencia válida', () => {
  const center = { latitude: -26, longitude: -65 };
  const ring = [[[-66, -27], [-64, -27], [-64, -25], [-66, -25], [-66, -27]]];
  const map = referenceMap(center, { latitude: -25, longitude: -64 }, ring);
  assert.deepEqual(map.center, { x: 160, y: 100 });
  assert.ok(map.epicenter.x > 160 && map.epicenter.y < 100);
  assert.equal(map.paths.length, 1);
  assert.deepEqual(referenceMap(center, center, []).center, referenceMap(center, center, []).epicenter);
});
test('coordenadas inválidas y polos no inventan mapa; cruce de fecha usa distancia corta', () => {
  assert.equal(referenceMap({ latitude: NaN, longitude: 0 }, { latitude: 0, longitude: 0 }, []), null);
  assert.equal(referenceMap({ latitude: 85, longitude: 0 }, { latitude: 85, longitude: 1 }, []), null);
  const map = referenceMap({ latitude: 0, longitude: 179 }, { latitude: 0, longitude: -179 }, []);
  assert.ok(map.epicenter.x > 160 && map.epicenter.x < 320);
});
test('GeoJSON conserva epicentro en orden latitud/longitud, no profundidad ni centro', () => {
  const now = Date.now();
  const events = parseEarthquakes({ type: 'FeatureCollection', features: [{ type: 'Feature', id: 'ficticio',
    properties: { type: 'earthquake', time: now - 60000, mag: 3, place: 'Ficticio' },
    geometry: { type: 'Point', coordinates: [-65.2, -26.3, 10] } }] }, { latitude: -26, longitude: -65 }, now);
  assert.deepEqual(events[0].epicenter, { latitude: -26.3, longitude: -65.2 });
  assert.equal(events[0].depthKm, 10);
});
