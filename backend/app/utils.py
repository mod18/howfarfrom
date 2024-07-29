from typing import Dict, List
from collections import defaultdict
from .cloud_api_connector import CloudApiConnector

def compute_matrix(form_data: Dict[str, List[Dict[str, str]]]) -> Dict[str, str]:
    q = CloudApiConnector()
    origin_dest_map = {}
    for origin in form_data.keys():
        origin_place = q.get_place(origin, is_origin=True)
        origin_dest_map[origin_place] = [
            {
            "destination": q.get_place(destination[0]["destination"], nearby=origin_place),
            "travel_modes": destination[0]["travel_modes"],
            }
            for destination in form_data[origin]
        ]
    return q.get_distances(origin_dest_map=origin_dest_map)


def parse_form_data(data: Dict[str, str]) -> Dict[str, str]:
    parsed_data = defaultdict(list)
    for key, val in data.items():
        parsed_key = key.split("_")
        if "destination" in parsed_key and val != "":
            origin_code = "_".join([parsed_key[0], parsed_key[1]])
            origin_str = data[origin_code]
            parsed_data[origin_str].append(val)
    return parsed_data
