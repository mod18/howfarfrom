from typing import List, Any, Dict, Union
from pydantic import BaseModel
from collections import defaultdict
import pandas as pd
import numpy as np


class Place(BaseModel):
    id: str
    name: str = None
    address: str = None
    address_components: list = None
    geo: Any = None
    lat: float = None
    lng: float = None
    maps_uri: str = None
    postcode: str = None
    postcode_prefix: str = None
    is_origin: bool
    raw_rank: int = None
    decile: int = None
    decile_stats: dict = None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        self._get_postcode()
        if self.is_origin:
            self._get_imd_data()

    def __repr__(self):
        return f"""
        {self.name}
        {self.address}
        """

    def __hash__(self):
        return hash((self.name, self.address))

    def __eq__(self, other):
        return (self.name, self.address) == (other.name, other.address)
    
    def _get_postcode(self):
        try:
            for comp in self.address_components:
                if "postal_code_prefix" in comp["types"]:
                    self.postcode_prefix = comp["longText"]
                    return
                elif "postal_code" in comp["types"]:
                    self.postcode = comp["longText"]
                    return
        except:
            self.postcode = 'Not found'

    def _get_imd_data(self):
        # TODO: REALLY NEED TO IMPLEMENT DATABASE
        self.raw_rank, self.decile, self.decile_stats = None, None, None
        try:
            load_data = pd.read_csv("data/imd_data_out.csv")
            if self.postcode is not None:
                imd_data = load_data[load_data["postcode"] == self.postcode]
                imd_data.set_index("postcode", inplace=True)
                imd_data = imd_data.to_dict()
                self.raw_rank, self.decile, self.decile_stats = imd_data["raw_rank"][self.postcode], imd_data["decile"][self.postcode], imd_data["decile_stats"][self.postcode]
                if self.decile_stats == "{}":
                    self.decile_stats = "IMD stats not available in Scotland and NI."
            elif self.postcode_prefix is not None:
                imd_data = load_data[load_data["postcode"].apply(lambda x: x.startswith(self.postcode_prefix))]
                imd_data.set_index("postcode", inplace=True)
                imd_data = imd_data.to_dict()
                self.raw_rank, self.decile, self.decile_stats = np.mean(list(imd_data["raw_rank"].values())).round(), np.mean(list(imd_data["decile"].values())).round(), "{}"
                if self.decile_stats == "{}":
                    self.decile_stats = "For more accurate data, please enter an exact address. IMD stats not available in Scotland and NI."
        except:
            pass


class Journey(BaseModel):
    origin: Place
    destination: Place
    travel_modes: List[Dict[str, Any]] = []

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        return f"Journey ({self.origin.name} -> {self.destination.name}))"
    
    def merge(self, other_journey):
        self.travel_modes.append(other_journey.travel_modes[0])


class TravelMatrix(BaseModel):
    journeys: List[Journey] = None
    formatted_matrix: Dict[str, Dict[str, Any]] = None

    def __init__(self, journeys: List[Journey]):
        super().__init__()
        self.journeys = journeys
        self._format_matrix()

    def __repr__(self):
        return f"TravelMatrix\n{self.print_journeys()}"

    def print_journeys(self):
        for journey in self.journeys:
            print(journey)

    def _format_matrix(self) -> None:
        """Formats journey data for frontend consumption"""
        self.formatted_matrix = defaultdict(str)
        i = 1
        for journey in self.journeys:
            origin_id = journey.origin.id
            if origin_id not in self.formatted_matrix:
                self.formatted_matrix[origin_id] = {'id': journey.origin.id, 'name': journey.origin.name, 'address': journey.origin.address, 'lat': journey.origin.lat, 'lng': journey.origin.lng, 'raw_rank': journey.origin.raw_rank, 'decile': journey.origin.decile, 'decile_stats': journey.origin.decile_stats, 'maps_uri': journey.origin.maps_uri, 'num_journeys': len(self.journeys)}
                i = 1
            self.formatted_matrix[origin_id] = self.formatted_matrix[origin_id] | {f'dest{i}': {'id': journey.destination.id, 'name': journey.destination.name, 'address': journey.destination.address, 'lat': journey.destination.lat, 'lng': journey.destination.lng, 'travel_modes': journey.travel_modes}}
            i += 1

        """
        {originid1 :{
        'origin': {name, address, lat, lng},
        'dest1': {name, address, lat, lng, travel_time_mins},
        'dest2': {name, address, lat, lng, travel_time_mins},
        ...
        }
        , originid2: {...}
        }
        """