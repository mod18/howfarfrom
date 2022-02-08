class Place():
    def __init__(self, id: str, address: str = None, name: str = None):
        self.id = id
        self.address = address
        self.name = name

    def __repr__(self):
        return f"{self.name} -- {self.address} ({self.id})"

class TravelTime():
    def __init__(self, origin: Place, destination: Place, travel_time_mins: int):
        self.origin = origin
        self.destination = destination
        self.travel_time_mins = travel_time_mins

    def __repr__(self):
        return f"{self.origin.name} -> {self.destination.name}: {self.travel_time_mins}"