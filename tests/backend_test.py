import requests
import sys
import json
from datetime import datetime, date
from decimal import Decimal

class GSTAPITester:
    def __init__(self, base_url="https://bf9adca5-80dc-4e30-b992-553663319474.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_expense_ids = []
        self.created_income_ids = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if method == 'POST' and 'id' in response_data:
                        print(f"   Created ID: {response_data['id']}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_create_expense_intrastate(self):
        """Test creating an expense with intrastate GST calculation"""
        expense_data = {
            "date": "2025-01-15",
            "description": "Office Equipment Purchase",
            "category": "equipment",
            "base_amount": 10000.0,
            "vendor_name": "Tech Solutions",
            "vendor_state": "Karnataka",
            "user_state": "Karnataka",
            "invoice_number": "INV-001"
        }
        
        success, response = self.run_test(
            "Create Expense (Intrastate - Equipment 18%)",
            "POST",
            "expenses",
            200,
            data=expense_data
        )
        
        if success and response:
            self.created_expense_ids.append(response['id'])
            # Verify GST calculation for intrastate
            gst_calc = response['gst_calculation']
            expected_gst = 10000 * 0.18  # 18% GST
            expected_cgst = expected_gst / 2
            expected_sgst = expected_gst / 2
            
            print(f"   GST Calculation Verification:")
            print(f"   Base Amount: ₹{gst_calc['base_amount']}")
            print(f"   CGST: ₹{gst_calc['cgst']} (Expected: ₹{expected_cgst})")
            print(f"   SGST: ₹{gst_calc['sgst']} (Expected: ₹{expected_sgst})")
            print(f"   Total GST: ₹{gst_calc['total_gst']} (Expected: ₹{expected_gst})")
            print(f"   Total Amount: ₹{gst_calc['total_amount']} (Expected: ₹{10000 + expected_gst})")
            print(f"   Is Interstate: {gst_calc['is_interstate']} (Expected: False)")
            
        return success

    def test_create_expense_interstate(self):
        """Test creating an expense with interstate GST calculation"""
        expense_data = {
            "date": "2025-01-15",
            "description": "Software License",
            "category": "software",
            "base_amount": 5000.0,
            "vendor_name": "Mumbai Tech",
            "vendor_state": "Maharashtra",
            "user_state": "Karnataka",
            "invoice_number": "INV-002"
        }
        
        success, response = self.run_test(
            "Create Expense (Interstate - Software 18%)",
            "POST",
            "expenses",
            200,
            data=expense_data
        )
        
        if success and response:
            self.created_expense_ids.append(response['id'])
            # Verify GST calculation for interstate
            gst_calc = response['gst_calculation']
            expected_gst = 5000 * 0.18  # 18% GST
            
            print(f"   GST Calculation Verification:")
            print(f"   Base Amount: ₹{gst_calc['base_amount']}")
            print(f"   IGST: ₹{gst_calc['igst']} (Expected: ₹{expected_gst})")
            print(f"   Total GST: ₹{gst_calc['total_gst']} (Expected: ₹{expected_gst})")
            print(f"   Total Amount: ₹{gst_calc['total_amount']} (Expected: ₹{5000 + expected_gst})")
            print(f"   Is Interstate: {gst_calc['is_interstate']} (Expected: True)")
            
        return success

    def test_create_expense_zero_gst(self):
        """Test creating an expense with 0% GST (office rent)"""
        expense_data = {
            "date": "2025-01-15",
            "description": "Monthly Office Rent",
            "category": "office_rent",
            "base_amount": 25000.0,
            "vendor_name": "Property Owner",
            "vendor_state": "Karnataka",
            "user_state": "Karnataka",
            "invoice_number": "RENT-001"
        }
        
        success, response = self.run_test(
            "Create Expense (0% GST - Office Rent)",
            "POST",
            "expenses",
            200,
            data=expense_data
        )
        
        if success and response:
            self.created_expense_ids.append(response['id'])
            # Verify GST calculation for 0% GST
            gst_calc = response['gst_calculation']
            
            print(f"   GST Calculation Verification:")
            print(f"   Base Amount: ₹{gst_calc['base_amount']}")
            print(f"   GST Rate: {gst_calc['gst_rate']}% (Expected: 0%)")
            print(f"   Total GST: ₹{gst_calc['total_gst']} (Expected: ₹0)")
            print(f"   Total Amount: ₹{gst_calc['total_amount']} (Expected: ₹25000)")
            
        return success

    def test_get_expenses(self):
        """Test retrieving all expenses"""
        success, response = self.run_test(
            "Get All Expenses",
            "GET",
            "expenses",
            200
        )
        
        if success and response:
            print(f"   Retrieved {len(response)} expenses")
            
        return success

    def test_create_income(self):
        """Test creating income with GST calculation"""
        income_data = {
            "date": "2025-01-15",
            "description": "Consulting Services",
            "base_amount": 50000.0,
            "client_name": "ABC Corp",
            "client_state": "Tamil Nadu",
            "user_state": "Karnataka",
            "invoice_number": "INV-INC-001"
        }
        
        success, response = self.run_test(
            "Create Income (Interstate - 18% GST)",
            "POST",
            "income",
            200,
            data=income_data
        )
        
        if success and response:
            self.created_income_ids.append(response['id'])
            # Verify GST calculation
            gst_calc = response['gst_calculation']
            expected_gst = 50000 * 0.18  # 18% GST
            
            print(f"   GST Calculation Verification:")
            print(f"   Base Amount: ₹{gst_calc['base_amount']}")
            print(f"   IGST: ₹{gst_calc['igst']} (Expected: ₹{expected_gst})")
            print(f"   Total GST: ₹{gst_calc['total_gst']} (Expected: ₹{expected_gst})")
            print(f"   Total Amount: ₹{gst_calc['total_amount']} (Expected: ₹{50000 + expected_gst})")
            print(f"   Is Interstate: {gst_calc['is_interstate']} (Expected: True)")
            
        return success

    def test_get_income(self):
        """Test retrieving all income"""
        success, response = self.run_test(
            "Get All Income",
            "GET",
            "income",
            200
        )
        
        if success and response:
            print(f"   Retrieved {len(response)} income records")
            
        return success

    def test_gst_summary(self):
        """Test GST summary calculation"""
        success, response = self.run_test(
            "Get GST Summary",
            "GET",
            "gst-summary",
            200
        )
        
        if success and response:
            print(f"   GST Summary:")
            print(f"   Total Sales: ₹{response['total_sales']}")
            print(f"   Total Purchases: ₹{response['total_purchases']}")
            print(f"   Output GST: ₹{response['output_gst']}")
            print(f"   Input Tax Credit: ₹{response['input_tax_credit']}")
            print(f"   Net GST Liability: ₹{response['net_gst_liability']}")
            print(f"   CGST Liability: ₹{response['cgst_liability']}")
            print(f"   SGST Liability: ₹{response['sgst_liability']}")
            print(f"   IGST Liability: ₹{response['igst_liability']}")
            
        return success

    def test_tax_advice(self):
        """Test AI tax advisor endpoint"""
        advice_request = {
            "query": "How can I optimize my GST filings as a freelancer?",
            "user_context": {"test": True}
        }
        
        success, response = self.run_test(
            "Get Tax Advice (AI)",
            "POST",
            "tax-advice",
            200,
            data=advice_request
        )
        
        if success and response:
            print(f"   AI Response Length: {len(response.get('advice', ''))}")
            print(f"   Session ID: {response.get('session_id', 'N/A')}")
            if len(response.get('advice', '')) > 0:
                print(f"   Sample Response: {response['advice'][:100]}...")
            
        return success

    def test_delete_expense(self):
        """Test deleting an expense"""
        if not self.created_expense_ids:
            print("❌ No expense IDs available for deletion test")
            return False
            
        expense_id = self.created_expense_ids[0]
        success, response = self.run_test(
            f"Delete Expense (ID: {expense_id})",
            "DELETE",
            f"expenses/{expense_id}",
            200
        )
        
        if success:
            self.created_expense_ids.remove(expense_id)
            
        return success

    def test_delete_income(self):
        """Test deleting an income record"""
        if not self.created_income_ids:
            print("❌ No income IDs available for deletion test")
            return False
            
        income_id = self.created_income_ids[0]
        success, response = self.run_test(
            f"Delete Income (ID: {income_id})",
            "DELETE",
            f"income/{income_id}",
            200
        )
        
        if success:
            self.created_income_ids.remove(income_id)
            
        return success

def main():
    print("🚀 Starting GST Automation Platform API Tests")
    print("=" * 60)
    
    tester = GSTAPITester()
    
    # Test sequence
    test_functions = [
        tester.test_root_endpoint,
        tester.test_create_expense_intrastate,
        tester.test_create_expense_interstate,
        tester.test_create_expense_zero_gst,
        tester.test_get_expenses,
        tester.test_create_income,
        tester.test_get_income,
        tester.test_gst_summary,
        tester.test_tax_advice,
        tester.test_delete_expense,
        tester.test_delete_income
    ]
    
    # Run all tests
    for test_func in test_functions:
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 TEST RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())