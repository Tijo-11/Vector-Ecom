import requests
import random
import string
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def get_random_string(length=10):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def run_test():
    cart_id = get_random_string()
    print(f"Test Cart ID: {cart_id}")

    # 1. Get a product
    try:
        resp = requests.get(f"{BASE_URL}/products/")
        if resp.status_code != 200:
            print("Failed to get products")
            return
        products = resp.json()['results']
        if not products:
            print("No products found")
            return
        product_id = products[0]['id']
        price = products[0]['price']
        country = "India"
        print(f"Using Product ID: {product_id}, Price: {price}")
    except Exception as e:
        print(f"Error fetching products: {e}")
        return

    # 2. Add Item with Qty 2
    print("\n--- Step 1: Add Item Qty 2 ---")
    payload = {
        "product": product_id,
        "qty": 2,
        "price": price,
        "country": country,
        "cart_id": cart_id,
        "shipping_amount": 0,
        "size": "M",
        "color": "Red"
    }
    resp = requests.post(f"{BASE_URL}/cart/", json=payload)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")

    # Verify Qty
    resp = requests.get(f"{BASE_URL}/cart-list/{cart_id}/")
    data = resp.json()
    items = data.get('results', data) if isinstance(data, dict) else data
    if items:
        print(f"Current Qty for Product {product_id}: {items[0]['qty']}")
    else:
        print("Cart empty?!")

    # 3. Update Item to Qty 3 (Bug check: should be 3, if bug -> 5)
    print("\n--- Step 2: Update Item to Qty 3 ---")
    payload['qty'] = 3
    resp = requests.post(f"{BASE_URL}/cart/", json=payload)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")

    # Verify Qty
    resp = requests.get(f"{BASE_URL}/cart-list/{cart_id}/")
    data = resp.json()
    items = data.get('results', data) if isinstance(data, dict) else data
    if items:
        qty = items[0]['qty']
        print(f"Current Qty for Product {product_id}: {qty}")
        if qty == 5:
            print("!!! BUG REPRODUCED: Qty became 5 (2+3) !!!")
        elif qty == 3:
            print("!!! NO BUG ON BACKEND: Qty is correct (3) !!!")
        else:
            print(f"!!! Unexpected Qty: {qty} !!!")
    else:
        print("Cart empty?!")

if __name__ == "__main__":
    run_test()
