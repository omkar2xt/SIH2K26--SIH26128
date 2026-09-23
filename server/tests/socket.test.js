const { io } = require('socket.io-client');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const URL = 'http://localhost:3000';
const SECRET = process.env.JWT_SECRET || 'test_secret';

const prisma = new PrismaClient();

function connectSocket(token) {
  return new Promise((resolve) => {
    const socket = io(URL, {
      auth: { token },
      reconnection: false,
      timeout: 3000
    });

    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => resolve({ error: err.message }));
  });
}

async function runTests() {
  console.log('--- PREPARING TEST DATA ---');
  let testState = {};
  
  try {
    // 1. Get roles
    const farmerRole = await prisma.role.findUnique({ where: { name: 'FARMER' } });
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const district = await prisma.district.findFirst();
    const species = await prisma.species.findFirst();

    // 2. Create Farmer A & B
    const farmerA = await prisma.user.create({
      data: { username: 'test_socket_farmer_a', fullName: 'Farmer A', roleId: farmerRole.id, email: 'a_socket@test.com' }
    });
    const farmerB = await prisma.user.create({
      data: { username: 'test_socket_farmer_b', fullName: 'Farmer B', roleId: farmerRole.id, email: 'b_socket@test.com' }
    });

    // 3. Create Farms
    const farmA = await prisma.farm.create({
      data: { code: 'FARM-SOCK-A', name: 'Farm A', districtId: district.id, ownerId: farmerA.id, latitude: 0, longitude: 0 }
    });
    const farmB = await prisma.farm.create({
      data: { code: 'FARM-SOCK-B', name: 'Farm B', districtId: district.id, ownerId: farmerB.id, latitude: 0, longitude: 0 }
    });

    // 4. Create Animals
    const animalA = await prisma.animal.create({
      data: { tagId: 'TEST-SOCK-TAG-A', speciesId: species.id, farmId: farmA.id, gender: 'FEMALE', ageMonths: 12, riskLevel: 'GREEN' }
    });
    const animalB = await prisma.animal.create({
      data: { tagId: 'TEST-SOCK-TAG-B', speciesId: species.id, farmId: farmB.id, gender: 'FEMALE', ageMonths: 12, riskLevel: 'GREEN' }
    });

    testState = { farmerA, farmerB, farmA, farmB, animalA, animalB };

    const validTokenA = jwt.sign({ userId: farmerA.id, role: 'FARMER' }, SECRET, { expiresIn: '1h' });
    const expiredToken = jwt.sign({ userId: farmerA.id, role: 'FARMER', exp: Math.floor(Date.now() / 1000) - 10 }, SECRET);
    const modifiedToken = validTokenA.split('.')[0] + '.' + Buffer.from(JSON.stringify({ userId: farmerB.id, role: 'ADMIN' })).toString('base64') + '.' + validTokenA.split('.')[2];
    
    console.log('--- STARTING SOCKET.IO SECURITY TEST MATRIX ---\n');
    let passed = 0;
    let failed = 0;

    function assert(name, condition) {
      if (condition) {
        console.log(`[PASS] ${name}`);
        passed++;
      } else {
        console.log(`[FAIL] ${name}`);
        failed++;
      }
    }

    // 1. Connection Tests
    const noTokenSocket = await connectSocket(null);
    assert('No JWT -> Connection rejected', noTokenSocket.error === 'Authentication error');

    const invalidTokenSocket = await connectSocket('invalid.token.here');
    assert('Invalid JWT -> Connection rejected', invalidTokenSocket.error === 'Authentication error');

    const expiredTokenSocket = await connectSocket(expiredToken);
    assert('Expired JWT -> Connection rejected', expiredTokenSocket.error === 'Authentication error');

    const modifiedTokenSocket = await connectSocket(modifiedToken);
    assert('Modified JWT -> Connection rejected', modifiedTokenSocket.error === 'Authentication error');

    const validSocket = await connectSocket(validTokenA);
    assert('Valid farmer JWT -> Connection accepted', validSocket.id !== undefined);

    if (validSocket.id) {
      // 2. Room Authorization Tests
      await new Promise(r => {
        validSocket.emit('join_room', { room: `farm:${farmA.id}` });
        validSocket.once('room_joined', (res) => {
          assert('Farmer joins own farm -> Allowed', res.success === true);
          r();
        });
      });

      await new Promise(r => {
        validSocket.emit('join_room', { room: `farm:${farmB.id}` });
        validSocket.once('room_error', (res) => {
          assert("Farmer joins another farmer's farm -> Denied", res.success === false);
          r();
        });
      });

      // 3. Telemetry Validation
      await new Promise(r => {
        validSocket.emit('telemetry_stream', { animalId: animalA.id, sensorType: 'TEMP', value: 38.5 });
        let received = false;
        
        validSocket.once('telemetry_update', () => { received = true; });
        setTimeout(() => {
          assert('Client valid telemetry -> Accepted/Broadcasted', received === true);
          r();
        }, 500);
      });

      await new Promise(r => {
        // Mass assignment attempt
        validSocket.emit('telemetry_stream', { animalId: animalA.id, sensorType: 'TEMP', value: 38.5, riskLevel: 'HIGH' });
        validSocket.once('telemetry_error', (res) => {
          assert('Client injects riskLevel -> Rejected', res.error === 'Validation failed');
          r();
        });
      });

      validSocket.disconnect();
    }

    console.log(`\n--- RESULTS: ${passed} Passed, ${failed} Failed ---\n`);
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    console.log('--- CLEANING UP TEST DATA ---');
    if (testState.animalB) await prisma.animal.delete({ where: { id: testState.animalB.id } });
    if (testState.animalA) await prisma.animal.delete({ where: { id: testState.animalA.id } });
    if (testState.farmB) await prisma.farm.delete({ where: { id: testState.farmB.id } });
    if (testState.farmA) await prisma.farm.delete({ where: { id: testState.farmA.id } });
    if (testState.farmerB) await prisma.user.delete({ where: { id: testState.farmerB.id } });
    if (testState.farmerA) await prisma.user.delete({ where: { id: testState.farmerA.id } });
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTests();
