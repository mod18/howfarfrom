from types import NoneType


class Place():
    def __init__(self, id: str, name: str):
        self.id = id
        self.name = name

class TravelTime():
    def __init__(self, origin: str, destination: str, travel_time_mins: int):
        self.origin = origin
        self.destination = destination
        self.travel_time_mins = travel_time_mins