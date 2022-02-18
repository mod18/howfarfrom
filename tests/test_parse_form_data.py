import unittest
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils import parse_form_data

test_form_data = {'origin_1': 'texas capitol building', 'origin_1_destination_1': 'heb', 'origin_1_destination_2': 'costco', 'origin_1_destination_3': 'austin airport', 'origin_1_destination_4': 'tacodeli', 'origin_1_destination_5': '', 'origin_2': 'zilker park', 'origin_2_destination_1': 'heb', 'origin_2_destination_2': 'costco', 'origin_2_destination_3': 'austin airport', 'origin_2_destination_4': 'tacodeli', 'origin_2_destination_5': ''}
expected_parsed_form_data = {'texas capitol building': ['heb', 'costco', 'austin airport', 'tacodeli'], 'zilker park': ['heb', 'costco', 'austin airport', 'tacodeli']}

class TestParseFormData(unittest.TestCase):

    def test_parser(self):
        self.assertEqual(expected_parsed_form_data, parse_form_data(test_form_data))

if __name__ == '__main__':
    unittest.main()