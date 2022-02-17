from typing import List, Any

class Place():
    def __init__(self, id: str, address: str = None, name: str = None, geo: Any = None):
        self.id = id
        self.address = address
        self.name = name
        self.geo = geo
        self._parse_geo()

    def __repr__(self):
        return f"""
        {self.name}
        {self.address}
        """

    def _parse_geo(self):
        self.lat, self.lng = self.geo["location"]["lat"], self.geo["location"]["lng"]

class Journey():
    def __init__(self, origin: Place, destination: Place, travel_time_mins: int):
        self.origin = origin
        self.destination = destination
        self.travel_time_mins = travel_time_mins

    def __repr__(self):
        return f"Journey ({self.origin.name} -> {self.destination.name}: {self.travel_time_mins})"

class TravelMatrix():
    def __init__(self, journeys=[]):
        self.journeys = journeys

    def __repr__(self):
        return "TravelMatrix"

    def print_journeys(self):
        for journey in self.journeys:
            print(journey)

    def update(self, journeys: List[Journey]) -> None:
        self.journeys += journeys