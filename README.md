# Order Management — أمثلة اختبار بـ Postman

ملف الEndpoints الخاصة بنظام الطلبات (Orders) في مشروع Sillage-Perfume-Backend.

قاعدة المسار: `http://localhost:5000/api/orders`

ملاحظات:
- مسارات عامة: إنشاء طلب (`POST /`)، تتبع طلب (`GET /track`).
- مسارات الادمن محمية: يجب إرسال هيدر `Authorization: Bearer <token>`.
- رقم الموبايل يجب أن يكون بصيغة مصرية: يبدأ بـ `01` ويتبعها 9 أرقام (مثال: `01012345678`).
- `trackingCode` شكلها: `SILL-XXXXXX`.

---

1) إنشاء طلب — POST /api/orders

URL:
```
POST http://localhost:5000/api/orders
```

Headers:
- `Content-Type: application/json`

Body (JSON) مثال:
```
{
  "userName": "محمد علي",
  "userPhone": "01012345678",
  "shippingAddress": {
    "street": "شارع التحرير 10",
    "city": "الزمالك",
    "governorate": "القاهرة",
    "postalCode": "11511"
  },
  "items": [
    {
      "product": "<PRODUCT_ID_1>",
      "sizeId": "<SIZE_ID_1>",
      "qty": 2
    },
    {
      "product": "<PRODUCT_ID_2>",
      "sizeId": "<SIZE_ID_2>",
      "qty": 1
    }
  ],
  "notes": "اتصل قبل التسليم",
  "delivery_at": "2026-02-20T10:00:00.000Z"
}
```

Response (201) مثال:
```
{
  "status": "success",
  "message": "Order created successfully",
  "data": { /* بيانات الطلب */ },
  "tracking": { "trackingCode": "SILL-AB12CD" }
}
```

---

2) تتبع طلب — GET /api/orders/track

URL مثال:
```
GET http://localhost:5000/api/orders/track?trackingCode=SILL-AB12CD&phoneLastDigits=5678
```

Response (200) سيُرجع تفاصيل الطلب لو تطابق آخر 4 أرقام من رقم الموبايل.

---

3) جلب طلبات (Admin) — GET /api/orders

URL:
```
GET http://localhost:5000/api/orders?page=1&limit=20&orderStatus=pending
```

Headers:
- `Authorization: Bearer <ADMIN_TOKEN>`

هذا يدعم فلاتر: `orderStatus`, `userPhone`, `startDate`, `endDate`.

---

4) جلب طلب حسب id (Admin) — GET /api/orders/:id

```
GET http://localhost:5000/api/orders/<ORDER_ID>
Headers: Authorization: Bearer <ADMIN_TOKEN>
```

---

5) تحديث حالة الطلب (Admin) — PATCH /api/orders/:id/status

URL:
```
PATCH http://localhost:5000/api/orders/<ORDER_ID>/status
```

Headers:
- `Content-Type: application/json`
- `Authorization: Bearer <ADMIN_TOKEN>`

Body مثال:
```
{ "status": "canceled" }
```

ملاحظة: عند الإلغاء (`canceled`) سيُسترجع المخزون تلقائياً.

---

6) حذف طلب (Admin) — DELETE /api/orders/:id

```
DELETE http://localhost:5000/api/orders/<ORDER_ID>
Headers: Authorization: Bearer <ADMIN_TOKEN>
```

ملاحظة: إذا لم يكن الطلب `delivered` فسيُعاد المخزون.

---

7) إحصائيات الطلبات (Admin) — GET /api/orders/stats/summary

```
GET http://localhost:5000/api/orders/stats/summary
Headers: Authorization: Bearer <ADMIN_TOKEN>
```

---

أمثلة curl سريعة:

- Create order:
```
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{ "userName":"Test", "userPhone":"01012345678", "shippingAddress": {"street":"s","city":"c","governorate":"g"}, "items": [{"product":"<PRODUCT_ID>","sizeId":"<SIZE_ID>","qty":1}] }'
```

- Track order:
```
curl "http://localhost:5000/api/orders/track?trackingCode=SILL-AB12CD&phoneLastDigits=5678"
```

---

استبدل `<PRODUCT_ID>`, `<SIZE_ID>`, `<ADMIN_TOKEN>` بقيم مناسبة من قاعدة البيانات أو جلسة الادمن الخاصة بك.

إذا تريد، أقدر أضيف مجموعة Postman collection جاهزة بصيغة JSON لتحمّلها مباشرة في Postman.
