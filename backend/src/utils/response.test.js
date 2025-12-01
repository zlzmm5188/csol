import { test } from 'node:test';
import assert from 'node:assert';
import { sendSuccess, sendError, generateOrderNo, generateUid, generateInviteCode } from './response.js';

test('sendSuccess returns correct format', () => {
  const mockRes = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    }
  };

  sendSuccess(mockRes, { test: 'data' }, 'Test message');

  assert.strictEqual(mockRes.statusCode, 200);
  assert.strictEqual(mockRes.body.code, 1);
  assert.strictEqual(mockRes.body.msg, 'Test message');
  assert.deepStrictEqual(mockRes.body.data, { test: 'data' });
  assert.ok(mockRes.body.timestamp);
});

test('sendError returns correct format', () => {
  const mockRes = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    }
  };

  sendError(mockRes, 'Error message', 400);

  assert.strictEqual(mockRes.statusCode, 400);
  assert.strictEqual(mockRes.body.code, 0);
  assert.strictEqual(mockRes.body.msg, 'Error message');
  assert.strictEqual(mockRes.body.data, null);
});

test('generateOrderNo returns unique string', () => {
  const orderNo1 = generateOrderNo();
  const orderNo2 = generateOrderNo();

  assert.ok(orderNo1.startsWith('ORD'));
  assert.ok(orderNo2.startsWith('ORD'));
  assert.notStrictEqual(orderNo1, orderNo2);
});

test('generateUid returns unique string', () => {
  const uid1 = generateUid();
  const uid2 = generateUid();

  assert.ok(uid1.startsWith('U'));
  assert.ok(uid2.startsWith('U'));
  assert.notStrictEqual(uid1, uid2);
});

test('generateInviteCode returns 8 character string', () => {
  const code = generateInviteCode();

  assert.strictEqual(code.length, 8);
  assert.ok(/^[A-Z0-9]+$/.test(code));
});
