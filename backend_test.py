#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class HishabNikashAPITester:
    def __init__(self, base_url="https://nikash-ops.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = "test_session_1776150388162"
        self.test_company_id = "ckfrozen"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, use_auth=True):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if use_auth:
            headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_preview": response.text[:100] if not success else "OK"
            })

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "response_preview": str(e)
            })
            return False, {}

    def test_companies_endpoint(self):
        """Test GET /api/companies - should return 4 companies"""
        success, response = self.run_test(
            "Get Companies List",
            "GET",
            "companies",
            200,
            use_auth=False
        )
        
        if success and isinstance(response, list):
            if len(response) == 4:
                print(f"   ✅ Correct number of companies: {len(response)}")
                company_ids = [c.get('company_id') for c in response]
                print(f"   Company IDs: {company_ids}")
                return True
            else:
                print(f"   ❌ Expected 4 companies, got {len(response)}")
        
        return success

    def test_auth_me(self):
        """Test GET /api/auth/me with session token"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        if success:
            expected_fields = ['user_id', 'email', 'name']
            missing_fields = [f for f in expected_fields if f not in response]
            if not missing_fields:
                print(f"   ✅ User data complete: {response.get('email', 'N/A')}")
            else:
                print(f"   ⚠️ Missing fields: {missing_fields}")
        
        return success

    def test_customers_endpoint(self):
        """Test GET /api/companies/ckfrozen/customers"""
        success, response = self.run_test(
            "Get Customers for CK Frozen",
            "GET",
            f"companies/{self.test_company_id}/customers",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} customers")
            if response:
                sample_customer = response[0]
                print(f"   Sample customer: {sample_customer.get('name', 'N/A')}")
        
        return success

    def test_vendors_endpoint(self):
        """Test GET /api/companies/ckfrozen/vendors"""
        success, response = self.run_test(
            "Get Vendors for CK Frozen",
            "GET",
            f"companies/{self.test_company_id}/vendors",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} vendors")
            if response:
                sample_vendor = response[0]
                print(f"   Sample vendor: {sample_vendor.get('name', 'N/A')}")
        
        return success

    def test_invoices_endpoint(self):
        """Test GET /api/companies/ckfrozen/invoices"""
        success, response = self.run_test(
            "Get Invoices for CK Frozen",
            "GET",
            f"companies/{self.test_company_id}/invoices",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} invoices")
            if response:
                sample_invoice = response[0]
                print(f"   Sample invoice: {sample_invoice.get('invoice_number', 'N/A')} - ${sample_invoice.get('total', 0)}")
        
        return success

    def test_dashboard_endpoint(self):
        """Test GET /api/companies/ckfrozen/dashboard"""
        success, response = self.run_test(
            "Get Dashboard KPIs for CK Frozen",
            "GET",
            f"companies/{self.test_company_id}/dashboard",
            200
        )
        
        if success:
            expected_kpis = ['total_sales', 'total_collected', 'outstanding_receivables', 'invoice_count']
            found_kpis = [k for k in expected_kpis if k in response]
            print(f"   ✅ KPIs found: {found_kpis}")
            print(f"   Total Sales: ${response.get('total_sales', 0):,}")
            print(f"   Invoice Count: {response.get('invoice_count', 0)}")
        
        return success

    def test_create_customer(self):
        """Test POST /api/companies/ckfrozen/customers"""
        test_customer = {
            "name": f"Test Customer {datetime.now().strftime('%H%M%S')}",
            "company_name": "Test Company LLC",
            "phone": "(555) 123-4567",
            "email": "test@testcompany.com",
            "address": "123 Test Street, Test City, NY 10001",
            "tax_id": "12-3456789",
            "notes": "Created by automated test"
        }
        
        success, response = self.run_test(
            "Create New Customer",
            "POST",
            f"companies/{self.test_company_id}/customers",
            201,
            data=test_customer
        )
        
        if success:
            print(f"   ✅ Customer created: {response.get('customer_id', 'N/A')}")
            return response.get('customer_id')
        
        return None

    def test_create_invoice(self):
        """Test POST /api/companies/ckfrozen/invoices"""
        # First get a customer to use
        customers_success, customers = self.run_test(
            "Get Customers for Invoice Creation",
            "GET",
            f"companies/{self.test_company_id}/customers",
            200
        )
        
        if not customers_success or not customers:
            print("   ❌ Cannot create invoice - no customers available")
            return False
        
        customer = customers[0]
        
        test_invoice = {
            "customer_id": customer['customer_id'],
            "customer_name": customer['name'],
            "invoice_date": datetime.now().strftime('%Y-%m-%d'),
            "due_date": "2026-02-15",
            "sales_rep": "Test Rep",
            "warehouse": "Test Warehouse",
            "items": [
                {
                    "product": "Test Product",
                    "description": "Test product for automated testing",
                    "quantity": 10,
                    "unit": "pcs",
                    "rate": 25.00,
                    "discount": 0,
                    "tax": 20.00,
                    "amount": 250.00
                }
            ],
            "notes": "Created by automated test",
            "terms": "Net 30",
            "subtotal": 250.00,
            "tax_total": 20.00,
            "discount_total": 0,
            "total": 270.00,
            "status": "Draft",
            "payment_status": "Unpaid",
            "amount_paid": 0
        }
        
        success, response = self.run_test(
            "Create New Invoice",
            "POST",
            f"companies/{self.test_company_id}/invoices",
            201,
            data=test_invoice
        )
        
        if success:
            print(f"   ✅ Invoice created: {response.get('invoice_number', 'N/A')}")
            return response.get('invoice_id')
        
        return None

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Hishab Nikash Pro API Tests")
        print(f"   Base URL: {self.base_url}")
        print(f"   Session Token: {self.session_token[:20]}...")
        print(f"   Test Company: {self.test_company_id}")
        print("=" * 60)

        # Test all endpoints
        self.test_companies_endpoint()
        self.test_auth_me()
        self.test_customers_endpoint()
        self.test_vendors_endpoint()
        self.test_invoices_endpoint()
        self.test_dashboard_endpoint()
        self.test_create_customer()
        self.test_create_invoice()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed")
            failed_tests = [t for t in self.test_results if not t['success']]
            print("\nFailed tests:")
            for test in failed_tests:
                print(f"   - {test['name']}: {test['actual_status']} (expected {test['expected_status']})")
            return 1

def main():
    tester = HishabNikashAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())