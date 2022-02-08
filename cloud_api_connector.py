import requests
import urllib.parse
import logging
import sys
from time import sleep
from typing import List, Dict, Tuple
from functools import lru_cache

from constants import CLOUD_API_KEY
from utils import Place, TravelTime

logger = logging.getLogger("__cloud_api_connector__")
logger.setLevel(logging.DEBUG)
formatter = logging.Formatter("%(asctime)s - %(name)s:%(levelname)s - %(message)s")

stream_handler = logging.StreamHandler(stream=sys.stdout)
stream_handler.setLevel(logging.INFO)
stream_handler.setFormatter(formatter)

file_handler = logging.FileHandler(filename="cloud_connector.log")
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(formatter)

logger.addHandler(stream_handler)
logger.addHandler(file_handler)


class CloudApiConnector:
    """Connects to the Cloud API"""

    def __init__(
        self,
        api_key=CLOUD_API_KEY,
        base_url="https://maps.googleapis.com/maps/api/",
    ):
        self.base_url = base_url
        self.api_key = api_key
        logger.debug("Built initialized")

    def __repr__(self):
        return "Google Cloud API Connector"

    def _get(self, url: str, params=dict()) -> str:
        attempts = 0
        while attempts <=5:
            try:
                response = requests.get(
                    url=url,
                    params=params,
                )
                response.raise_for_status()
            except requests.ConnectionError:
                logger.error(f"Failed to the Cloud API. Retrying...({attempts} / 5")
                sleep(attempts * attempts)
            except requests.HTTPError as e:
                logger.error(f"{response.status_code} Error: {e}")
                sleep(attempts * attempts)                
            else:
                logger.info("GET request successful")
                logger.debug(response.json())
                return response.json()
            finally:
                attempts += 1

    @lru_cache
    def get_place(self, query: str, output="json") -> str:
        """Gets a place_id and name from a search string
        
        https://developers.google.com/maps/documentation/places/web-service/search-find-place?hl=en_US
        """
        if not isinstance(query, str):
            print("Query must be a string")
            return

        endpoint = self.base_url + f"place/findplacefromtext/{output}"
        input = urllib.parse.quote(query)
        inputtype = "textquery"
        fields = "place_id,name,formatted_address"
        url = endpoint + f"?input={input}&inputtype={inputtype}&fields={fields}&key={self.api_key}"
        resp = self._get(url=url)
        logger.debug(f"Places API call successful: {resp}")
        return Place(id=resp["candidates"][0]["place_id"], name=resp["candidates"][0]["name"], address=resp["candidates"][0]["formatted_address"])

    def get_distances(self, origins: List[Place], destinations: List[Place], output="json") -> str:
        """Gets the travel time and distance between origins and destinations
        
        Origins and destinations should be proper place ids from the Cloud API, not search strings.
        
        https://developers.google.com/maps/documentation/distance-matrix/overview?hl=en_US
        """
        endpoint = self.base_url + f"distancematrix/{output}"
        enc_origins = urllib.parse.quote("|".join([f"place_id:{origin.id}" for origin in origins]))
        enc_destinations = urllib.parse.quote("|".join([f"place_id:{dest.id}" for dest in destinations]))
        url = endpoint + f"?origins={enc_origins}&destinations={enc_destinations}&key={self.api_key}"
        resp = self._get(url=url)
        logger.debug(f"Distance API call successful: {resp}")

        origin_count, results = 0, []
        for origin in resp["origin_addresses"]:
            origin_place = self.get_place(query=origin)
            row_count = 0
            for destination in resp["destination_addresses"]:
                destination_place = self.get_place(query=destination)
                results.append(TravelTime(origin=origin_place, destination=destination_place, travel_time_mins=resp["rows"][origin_count]["elements"][row_count]["duration"]["text"]))
                row_count += 1
            origin_count += 1
        return results
