from typing import List, Any
from pydantic import BaseModel

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
    journeys: List

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        return "TravelMatrix"

    def print_journeys(self):
        for journey in self.journeys:
            print(journey)

    def update(self, journeys: List[Journey]) -> None:
        self.journeys += journeys
