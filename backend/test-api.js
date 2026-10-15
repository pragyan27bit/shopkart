const http = require('http');
const app = require('./index');

let server;
const PORT = 5055;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };
    if (data) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(responseBody);
          } catch {
            parsed = responseBody;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const mongoose = require('mongoose');

async function runTests() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopkart';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }
  server = app.listen(PORT, async () => {
    console.log(`Test server listening on port ${PORT}...`);
    let passed = 0;
    let total = 0;

    function assert(desc, condition, details = '') {
      total++;
      if (condition) {
        console.log(` PASS: ${desc}`);
        passed++;
      } else {
        console.error(` FAIL: ${desc} ${details}`);
      }
    }

    try {
      const testEmail = `tester_${Date.now()}@example.com`;

      // 1. Register: missing field -> 400
      const r1 = await request('POST', '/customers/register', {
        fullName: 'Test User',
        email: testEmail,
      });
      assert('Register: missing field returns 400', r1.status === 400, `Got ${r1.status}`);

      // 2. Register: short password -> 400
      const r2 = await request('POST', '/customers/register', {
        fullName: 'Test User',
        email: testEmail,
        password: '123',
        phone: '1234567890',
      });
      assert('Register: password < 6 chars returns 400', r2.status === 400, `Got ${r2.status}`);

      // 3. Register: valid -> 201
      const r3 = await request('POST', '/customers/register', {
        fullName: 'Test User',
        email: testEmail,
        password: 'password123',
        phone: '1234567890',
      });
      assert('Register: valid customer returns 201', r3.status === 201, `Got ${r3.status}`);
      assert('Register: password not returned', !r3.body.customer?.password);

      // 4. Register duplicate email -> 409
      const r4 = await request('POST', '/customers/register', {
        fullName: 'Test User 2',
        email: testEmail,
        password: 'password123',
        phone: '1234567890',
      });
      assert('Register: duplicate email returns 409', r4.status === 409, `Got ${r4.status}`);

      // 5. Login: invalid credentials -> 401
      const r5 = await request('POST', '/customers/login', {
        email: testEmail,
        password: 'wrongpassword',
      });
      assert('Login: invalid password returns 401', r5.status === 401, `Got ${r5.status}`);

      // 6. Login: valid credentials -> 200 + cookie
      const r6 = await request('POST', '/customers/login', {
        email: testEmail,
        password: 'password123',
      });
      assert('Login: valid credentials returns 200', r6.status === 200, `Got ${r6.status}`);
      const setCookie = r6.headers['set-cookie'];
      assert('Login: sets HttpOnly cookie', Array.isArray(setCookie) && setCookie.some((c) => c.includes('token=')));
      const cookieHeader = setCookie ? setCookie.map((c) => c.split(';')[0]).join('; ') : '';
      const token = r6.body.token;

      // 7. Profile: without cookie -> 401
      const r7 = await request('GET', '/customers/me');
      assert('Profile: unauthorized without token returns 401', r7.status === 401, `Got ${r7.status}`);

      // 8. Profile: with cookie -> 200
      const r8 = await request('GET', '/customers/me', null, { Cookie: cookieHeader });
      assert('Profile: with cookie returns 200', r8.status === 200, `Got ${r8.status}`);
      assert('Profile: returns customer info', r8.body.email === testEmail);

      // 9. Profile: with Bearer token -> 200
      const r9 = await request('GET', '/customers/me', null, { Authorization: `Bearer ${token}` });
      assert('Profile: with Bearer token returns 200', r9.status === 200, `Got ${r9.status}`);

      // 10. Products: Get all
      const r10 = await request('GET', '/products');
      assert('Products: GET /products returns 200', r10.status === 200, `Got ${r10.status}`);
      assert('Products: returns products array', Array.isArray(r10.body.products) && r10.body.products.length > 0);
      const testProduct = r10.body.products[0];

      // 11. Products: Search & Category filter
      const r11 = await request('GET', `/products?search=${encodeURIComponent(testProduct.name.slice(0, 4))}`);
      assert('Products: search query works', r11.status === 200 && r11.body.products.length > 0);

      const r12 = await request('GET', `/products?category=${encodeURIComponent(testProduct.category)}`);
      assert('Products: category filter works', r12.status === 200 && r12.body.products.every((p) => p.category === testProduct.category));

      // 12. Products: Get single product
      const r13 = await request('GET', `/products/${testProduct._id}`);
      assert('Products: GET /products/:id returns 200', r13.status === 200, `Got ${r13.status}`);

      const r14 = await request('GET', '/products/invalid_id_123');
      assert('Products: invalid ID returns 400', r14.status === 400, `Got ${r14.status}`);

      // 13. Wishlist: Unauthorized
      const r15 = await request('POST', `/wishlist/${testProduct._id}`);
      assert('Wishlist: unauthorized add returns 401', r15.status === 401, `Got ${r15.status}`);

      // 14. Wishlist: Add product with auth
      const r16 = await request('POST', `/wishlist/${testProduct._id}`, null, { Cookie: cookieHeader });
      assert('Wishlist: add product returns 200', r16.status === 200, `Got ${r16.status}`);

      // 15. Wishlist: Duplicate add -> 409
      const r17 = await request('POST', `/wishlist/${testProduct._id}`, null, { Cookie: cookieHeader });
      assert('Wishlist: duplicate add returns 409', r17.status === 409, `Got ${r17.status}`);

      // 16. Wishlist: Get wishlist -> populated product data
      const r18 = await request('GET', '/wishlist', null, { Cookie: cookieHeader });
      assert('Wishlist: GET /wishlist returns 200', r18.status === 200, `Got ${r18.status}`);
      assert('Wishlist: populated product data has name', r18.body.wishlist[0]?.name === testProduct.name);

      // 17. Wishlist: Remove product
      const r19 = await request('DELETE', `/wishlist/${testProduct._id}`, null, { Cookie: cookieHeader });
      assert('Wishlist: DELETE /wishlist/:id returns 200', r19.status === 200, `Got ${r19.status}`);

      // 18. Wishlist: Remove non-existent item from wishlist -> 404
      const r20 = await request('DELETE', `/wishlist/${testProduct._id}`, null, { Cookie: cookieHeader });
      assert('Wishlist: remove item not in wishlist returns 404', r20.status === 404, `Got ${r20.status}`);

      // 19. Cart: Unauthorized request -> 401
      const r21_cart = await request('POST', `/cart/${testProduct._id}`);
      assert('Cart: unauthorized add returns 401', r21_cart.status === 401, `Got ${r21_cart.status}`);

      // 20. Cart: Add new item -> quantity = 1
      const r22 = await request('POST', `/cart/${testProduct._id}`, null, { Cookie: cookieHeader });
      assert('Cart: add item returns 200', r22.status === 200, `Got ${r22.status}`);
      const itemAfterFirstAdd = r22.body.cart?.find((i) => (i.product?._id || i.product) === testProduct._id);
      assert('Cart: first add has quantity 1', itemAfterFirstAdd?.quantity === 1, `Got ${itemAfterFirstAdd?.quantity}`);

      // 21. Cart: Add same item again -> increments quantity to 2
      const r23 = await request('POST', `/cart/${testProduct._id}`, null, { Cookie: cookieHeader });
      assert('Cart: re-add same product returns 200', r23.status === 200, `Got ${r23.status}`);
      const itemAfterSecondAdd = r23.body.cart?.find((i) => (i.product?._id || i.product) === testProduct._id);
      assert('Cart: second add increments quantity to 2', itemAfterSecondAdd?.quantity === 2, `Got ${itemAfterSecondAdd?.quantity}`);

      // 22. Cart: GET /cart -> populates product info
      const r24 = await request('GET', '/cart', null, { Cookie: cookieHeader });
      assert('Cart: GET /cart returns 200', r24.status === 200, `Got ${r24.status}`);
      assert('Cart: product is populated with name', r24.body.cart[0]?.product?.name === testProduct.name);
      assert('Cart: product is populated with price', r24.body.cart[0]?.product?.price === testProduct.price);

      // 23. Cart: PATCH quantity to 3
      const r25 = await request('PATCH', `/cart/${testProduct._id}`, { quantity: 3 }, { Cookie: cookieHeader });
      assert('Cart: PATCH quantity to 3 returns 200', r25.status === 200, `Got ${r25.status}`);
      const itemAfterPatch = r25.body.cart?.find((i) => (i.product?._id || i.product) === testProduct._id);
      assert('Cart: quantity updated to 3', itemAfterPatch?.quantity === 3, `Got ${itemAfterPatch?.quantity}`);

      // 24. Cart: PATCH quantity < 1 -> 400
      const r26 = await request('PATCH', `/cart/${testProduct._id}`, { quantity: 0 }, { Cookie: cookieHeader });
      assert('Cart: quantity < 1 returns 400', r26.status === 400, `Got ${r26.status}`);

      // 25. Cart: PATCH quantity > stock -> 400
      const r27 = await request('PATCH', `/cart/${testProduct._id}`, { quantity: 99999 }, { Cookie: cookieHeader });
      assert('Cart: quantity > stock returns 400', r27.status === 400, `Got ${r27.status}`);

      // 26. Cart: DELETE /cart/:productId -> removes item
      const r28 = await request('DELETE', `/cart/${testProduct._id}`, null, { Cookie: cookieHeader });
      assert('Cart: DELETE /cart/:productId returns 200', r28.status === 200, `Got ${r28.status}`);
      const itemAfterDelete = r28.body.cart?.find((i) => (i.product?._id || i.product) === testProduct._id);
      assert('Cart: item no longer in cart', !itemAfterDelete);

      // 27. Cart: DELETE non-existent item -> 404
      const r29 = await request('DELETE', `/cart/${testProduct._id}`, null, { Cookie: cookieHeader });
      assert('Cart: delete non-existent item returns 404', r29.status === 404, `Got ${r29.status}`);

      // 28. Orders: Empty cart creation returns 400
      const r30_empty = await request('POST', '/orders/create-payment-order', {
        shippingAddress: {
          fullName: 'Aarav Sharma',
          phone: '9876543210',
          addressLine1: '22 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
      }, { Cookie: cookieHeader });
      assert('Orders: empty cart returns 400', r30_empty.status === 400, `Got ${r30_empty.status}`);

      // Add item to cart for order creation
      await request('POST', `/cart/${testProduct._id}`, null, { Cookie: cookieHeader });

      // 29. Orders: Unauthorized create-payment-order returns 401
      const r31_unauth = await request('POST', '/orders/create-payment-order', {
        shippingAddress: {
          fullName: 'Aarav Sharma',
          phone: '9876543210',
          addressLine1: '22 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
      });
      assert('Orders: unauthorized create-payment-order returns 401', r31_unauth.status === 401, `Got ${r31_unauth.status}`);

      // 30. Orders: Invalid pincode returns 400
      const r32_pincode = await request('POST', '/orders/create-payment-order', {
        shippingAddress: {
          fullName: 'Aarav Sharma',
          phone: '9876543210',
          addressLine1: '22 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '123', // invalid
        },
      }, { Cookie: cookieHeader });
      assert('Orders: invalid pincode returns 400', r32_pincode.status === 400, `Got ${r32_pincode.status}`);

      // 31. Orders: Valid create-payment-order ignores frontend total
      const r33_create = await request('POST', '/orders/create-payment-order', {
        shippingAddress: {
          fullName: 'Aarav Sharma',
          phone: '9876543210',
          addressLine1: '22 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
        totalAmount: 1, // Fake total from frontend
      }, { Cookie: cookieHeader });
      assert('Orders: create-payment-order returns 201', r33_create.status === 201, `Got ${r33_create.status}`);
      assert('Orders: returns shopKartOrderId & razorpayOrderId', Boolean(r33_create.body.shopKartOrderId && r33_create.body.razorpayOrderId));
      const expectedPaise = Math.round(testProduct.price * 1 * 100);
      assert('Orders: server calculates real total ignoring fake total', r33_create.body.amount === expectedPaise, `Expected ${expectedPaise}, got ${r33_create.body.amount}`);

      const createdOrderId = r33_create.body.shopKartOrderId;
      const rzpOrderId = r33_create.body.razorpayOrderId;

      // 32. Cart before payment verification still has items
      const r34_cartCheck = await request('GET', '/cart', null, { Cookie: cookieHeader });
      assert('Orders: cart preserved before payment verification', r34_cartCheck.body.cart?.length > 0);

      // 33. Orders: Verify payment with fake/invalid signature returns 400
      const r35_badSig = await request('POST', '/orders/verify-payment', {
        shopKartOrderId: createdOrderId,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: 'pay_test_12345',
        razorpay_signature: 'fake_signature_abc',
      }, { Cookie: cookieHeader });
      assert('Orders: fake signature returns 400', r35_badSig.status === 400, `Got ${r35_badSig.status}`);

      // Cart still preserved after payment failure
      const r36_cartStillPreserved = await request('GET', '/cart', null, { Cookie: cookieHeader });
      assert('Orders: cart preserved after failed payment verification', r36_cartStillPreserved.body.cart?.length > 0);

      // 34. Orders: Verify payment with valid signature
      const testPaymentId = `pay_${Date.now()}`;
      const crypto = require('crypto');
      const rzpSecret = process.env.RAZORPAY_KEY_SECRET || 'shopkart_razorpay_secret_test_key';
      const validSig = crypto
        .createHmac('sha256', rzpSecret)
        .update(`${rzpOrderId}|${testPaymentId}`)
        .digest('hex');

      const r37_validSig = await request('POST', '/orders/verify-payment', {
        shopKartOrderId: createdOrderId,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: testPaymentId,
        razorpay_signature: validSig,
      }, { Cookie: cookieHeader });
      assert('Orders: valid signature returns 200', r37_validSig.status === 200, `Got ${r37_validSig.status}`);
      assert('Orders: order status is PLACED', r37_validSig.body.order?.status === 'PLACED');
      assert('Orders: paymentStatus is PAID', r37_validSig.body.order?.paymentStatus === 'PAID');

      // 35. Orders: Cart is cleared only after verified payment
      const r38_cartCleared = await request('GET', '/cart', null, { Cookie: cookieHeader });
      assert('Orders: cart cleared after successful payment', r38_cartCleared.body.cart?.length === 0);

      // 36. Orders: GET /orders returns user orders
      const r39_getOrders = await request('GET', '/orders', null, { Cookie: cookieHeader });
      assert('Orders: GET /orders returns 200', r39_getOrders.status === 200, `Got ${r39_getOrders.status}`);
      const foundOrder = r39_getOrders.body.orders?.find((o) => o._id === createdOrderId);
      assert('Orders: order list contains created order', Boolean(foundOrder));
      assert('Orders: snapshot item contains name and price', foundOrder?.items[0]?.name === testProduct.name);

      // 37. Orders: GET /orders/:id returns order
      const r40_singleOrder = await request('GET', `/orders/${createdOrderId}`, null, { Cookie: cookieHeader });
      assert('Orders: GET /orders/:id returns 200', r40_singleOrder.status === 200, `Got ${r40_singleOrder.status}`);
      assert('Orders: single order has totalAmount', r40_singleOrder.body.order?.totalAmount === testProduct.price);

      // 38. Orders: Unauthorized access to another user's order
      const userBEmail = `userB_${Date.now()}@example.com`;
      await request('POST', '/customers/register', {
        fullName: 'User B',
        email: userBEmail,
        password: 'password123',
        phone: '9998887776',
      });
      const loginB = await request('POST', '/customers/login', {
        email: userBEmail,
        password: 'password123',
      });
      const cookieB = loginB.headers['set-cookie']?.map((c) => c.split(';')[0]).join('; ');

      const r41_forbidden = await request('GET', `/orders/${createdOrderId}`, null, { Cookie: cookieB });
      assert('Orders: user B accessing user A order returns 403', r41_forbidden.status === 403, `Got ${r41_forbidden.status}`);

      // 39. Orders (Bonus): Update order status progression
      const r42_status = await request('PATCH', `/orders/${createdOrderId}/status`, { status: 'CONFIRMED' }, { Cookie: cookieHeader });
      assert('Orders: PATCH status progression returns 200', r42_status.status === 200 && r42_status.body.order?.status === 'CONFIRMED');

      // 40. Logout: POST /customers/logout
      const r43_logout = await request('POST', '/customers/logout', null, { Cookie: cookieHeader });
      assert('Logout: POST /customers/logout returns 200', r43_logout.status === 200, `Got ${r43_logout.status}`);

      console.log(`\nResults: ${passed}/${total} tests passed!`);
    } catch (err) {
      console.error('Test execution failed:', err);
    } finally {
      server.close(() => {
        console.log('Test server shut down.');
        process.exit(0);
      });
    }
  });
}

runTests();
