import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, limit, query, serverTimestamp,
  setDoc, setLogLevel, Timestamp, updateDoc } from 'firebase/firestore';

// Negarse a ejecutar fuera del emulador indicado; nunca leer .env.local ni credenciales reales.
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8085', 'Iniciar mediante npm.cmd test desde firebase/.');
// Los rechazos esperados se verifican con assertFails; evitar duplicar logs del SDK.
setLogLevel('silent');
const projectId = 'demo-proyecto-clima';
let environment;
const db = (uid) => uid ? environment.authenticatedContext(uid).firestore() : environment.unauthenticatedContext().firestore();
const ref = (database, owner, id = 'lugar-ficticio') => doc(database, `users/${owner}/locations/${id}`);
const valid = () => ({ label: 'Localidad ficticia', latitude: -26, longitude: -65,
  createdAt: serverTimestamp(), updatedAt: serverTimestamp() });

before(async () => {
  environment = await initializeTestEnvironment({ projectId,
    firestore: { host: '127.0.0.1', port: 8085, rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});
beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    for (const uid of ['usuario-a', 'usuario-b']) await setDoc(ref(context.firestore(), uid), {
      label: 'Lugar ficticio existente', latitude: 0, longitude: 0,
      createdAt: Timestamp.fromMillis(1000), updatedAt: Timestamp.fromMillis(1000),
    });
  });
});
after(async () => { await environment?.cleanup(); });

test('propietario puede crear, leer, listar, editar y borrar sus lugares', async () => {
  const database = db('usuario-a'); const place = ref(database, 'usuario-a', 'nuevo');
  await assertSucceeds(setDoc(place, valid()));
  assert.equal((await assertSucceeds(getDoc(place))).data().label, 'Localidad ficticia');
  assert.equal((await assertSucceeds(getDocs(query(collection(database, 'users/usuario-a/locations'), limit(20))))).size, 2);
  const created = (await getDoc(place)).data().createdAt;
  await assertSucceeds(updateDoc(place, { label: 'Lugar ficticio editado', updatedAt: serverTimestamp() }));
  assert.ok((await getDoc(place)).data().createdAt.isEqual(created));
  await assertSucceeds(deleteDoc(place));
});

test('A y B no pueden leer, listar, crear, editar ni borrar lugares del otro', async () => {
  for (const [actor, owner] of [['usuario-a', 'usuario-b'], ['usuario-b', 'usuario-a']]) {
    const database = db(actor);
    await assertFails(getDoc(ref(database, owner)));
    await assertFails(getDocs(query(collection(database, `users/${owner}/locations`), limit(20))));
    await assertFails(setDoc(ref(database, owner, 'intruso'), valid()));
    await assertFails(updateDoc(ref(database, owner), { label: 'Cambio no autorizado', updatedAt: serverTimestamp() }));
    await assertFails(deleteDoc(ref(database, owner)));
  }
});

test('sin sesión no se permite ninguna operación sobre lugares', async () => {
  const database = db();
  await assertFails(getDoc(ref(database, 'usuario-a')));
  await assertFails(getDocs(query(collection(database, 'users/usuario-a/locations'), limit(20))));
  await assertFails(setDoc(ref(database, 'usuario-a', 'nuevo'), valid()));
  await assertFails(updateDoc(ref(database, 'usuario-a'), { label: 'Cambio', updatedAt: serverTimestamp() }));
  await assertFails(deleteDoc(ref(database, 'usuario-a')));
});

test('rechaza campos extra y cada campo obligatorio ausente', async () => {
  const place = ref(db('usuario-a'), 'usuario-a', 'invalido');
  for (const field of ['uid', 'email', 'symptoms', 'timezone']) await assertFails(setDoc(place, { ...valid(), [field]: 'ficticio' }));
  for (const field of Object.keys(valid())) { const data = valid(); delete data[field]; await assertFails(setDoc(place, data)); }
});

test('rechaza nombres, coordenadas y tipos inválidos', async () => {
  const place = ref(db('usuario-a'), 'usuario-a', 'invalido');
  for (const label of ['', '   ', '\t', 'a'.repeat(161), 42, null]) await assertFails(setDoc(place, { ...valid(), label }));
  for (const latitude of [-90.0001, 90.0001, Infinity, -Infinity, NaN, '0', null]) await assertFails(setDoc(place, { ...valid(), latitude }));
  for (const longitude of [-180.0001, 180.0001, Infinity, -Infinity, NaN, '0', null]) await assertFails(setDoc(place, { ...valid(), longitude }));
});

test('admite cero, extremos geográficos y nombre de 160 caracteres', async () => {
  const database = db('usuario-a');
  for (const [index, [latitude, longitude]] of [[-90, -180], [90, 180], [0, 0]].entries()) {
    await assertSucceeds(setDoc(ref(database, 'usuario-a', `extremo-${index}`), { ...valid(), label: 'a'.repeat(160), latitude, longitude }));
  }
});

test('rechaza fechas de cliente y modificación de fecha de creación', async () => {
  const database = db('usuario-a');
  for (const field of ['createdAt', 'updatedAt']) {
    await assertFails(setDoc(ref(database, 'usuario-a', 'invalido'), { ...valid(), [field]: Timestamp.fromMillis(1000) }));
    await assertFails(setDoc(ref(database, 'usuario-a', 'invalido'), { ...valid(), [field]: 'ficticio' }));
  }
  await assertFails(updateDoc(ref(database, 'usuario-a'), { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(ref(database, 'usuario-a'), { updatedAt: Timestamp.fromMillis(1000) }));
  await assertFails(updateDoc(ref(database, 'usuario-a'), { email: 'ficticio', updatedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(ref(database, 'usuario-a'), { longitude: 180, updatedAt: serverTimestamp() }));
});

test('requiere lista paginada, sin consultas globales entre usuarios', async () => {
  const database = db('usuario-a'); const places = collection(database, 'users/usuario-a/locations');
  await assertSucceeds(getDocs(query(places, limit(1))));
  await assertFails(getDocs(places));
  await assertFails(getDocs(query(places, limit(21))));
  await assertFails(getDocs(query(collectionGroup(database, 'locations'), limit(20))));
});

test('deniega preferencias, salud, documentos raíz y demás rutas', async () => {
  const database = db('usuario-a');
  for (const route of ['users/usuario-a', 'users/usuario-a/preferences/main', 'users/usuario-a/symptoms/ficticio', 'public/ficticio']) {
    const target = doc(database, route);
    await assertFails(getDoc(target));
    await assertFails(setDoc(target, { ficticio: true }));
    await assertFails(deleteDoc(target));
  }
});
