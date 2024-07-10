from typing import List, Any, Dict, Union
from pydantic import BaseModel
from collections import defaultdict

class Place(BaseModel):
    id: str
    name: str = None
    address: str = None
    geo: Any = None
    lat: float = None
    lng: float = None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._parse_geo()

    def __repr__(self):
        return f"""
        {self.name}
        {self.address}
        """

    def __hash__(self):
        return hash((self.name, self.address))

    def __eq__(self, other):
        return (self.name, self.address) == (other.name, other.address)

    def _parse_geo(self):
        self.lat, self.lng = self.geo["location"]["lat"], self.geo["location"]["lng"]


class Journey(BaseModel):
    origin: Place
    destination: Place
    travel_time_mins: int

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        return f"Journey ({self.origin.name} -> {self.destination.name}: {self.travel_time_mins})"


class TravelMatrix(BaseModel):
    journeys: List[Journey] = None
    formatted_matrix: Dict[str, Dict[str, Union[str, float]]] = None

    def __init__(self, journeys: List[Journey]):
        super().__init__()
        self.journeys = journeys
        self._format_matrix()

    def __repr__(self):
        return "TravelMatrix"

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
                self.formatted_matrix[origin_id] = {'id': journey.origin.id, 'name': journey.origin.name, 'address': journey.origin.address, 'lat': journey.origin.lat, 'lng': journey.origin.lng}
                i = 1
            self.formatted_matrix[origin_id] = self.formatted_matrix[origin_id] | {f'dest{i}': {'id': journey.destination.id, 'name': journey.destination.name, 'address': journey.destination.address, 'lat': journey.destination.lat, 'lng': journey.destination.lng, 'travel_time': journey.travel_time_mins}}
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