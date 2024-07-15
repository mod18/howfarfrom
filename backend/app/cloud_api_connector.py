import requests
import urllib.parse
import logging
import sys
import os
import json
from time import sleep
from typing import List, Dict, Tuple
from functools import lru_cache
from collections import defaultdict

from dotenv import load_dotenv
from .models import Place, Journey, TravelMatrix

load_dotenv()

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
        self, api_key=os.environ.get("GOOGLE_API_KEY"), base_url="https://maps.googleapis.com/maps/api/",
    ):
        self.base_url = base_url
        self.api_key = api_key

        self.distance_cache = defaultdict(str)

    def __repr__(self):
        return "Google Cloud API Connector"

    def _get(self, url: str, params=dict()) -> str:
        attempts = 0
        while attempts <= 5:
            try:
                response = requests.get(url=url, params=params)
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

    def _post(self, url: str, headers=dict(), params=dict()) -> str:
        attempts = 0
        while attempts <= 5:
            try:
                response = requests.post(url=url, headers=headers, data=params)
                response.raise_for_status()
            except requests.ConnectionError:
                logger.error(f"Failed to the Cloud API. Retrying...({attempts} / 5")
                sleep(attempts * attempts)
            except requests.HTTPError as e:
                logger.error(f"{response.status_code} Error: {e}")
                sleep(attempts * attempts)
            else:
                logger.info("POST request successful")
                logger.debug(response.json())
                return response.json()
            finally:
                attempts += 1

    @lru_cache
    def get_place(self, query: str, nearby: Place = None, is_origin: bool = False) -> str:
        """Gets a place_id and name from a search string
        
        https://developers.google.com/maps/documentation/places/web-service/search-find-place?hl=en_US
        """
        if not isinstance(query, str):
            logger.error(f"Query must be a string: {query}")
            return

        endpoint = "https://places.googleapis.com/v1/places:searchText"
        params = {
            "textQuery": query,
        }
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": "places.name,places.displayName,places.formattedAddress,places.addressComponents,places.googleMapsUri,places.location"
        }
        if nearby:
            params["locationBias"] = {
                "circle": {
                    "center": {
                    "latitude": nearby.lat,
                    "longitude": nearby.lng
                    },
                    "radius": 500.0
                }
            }
        params = json.dumps(params)
        resp = self._post(url=endpoint, headers=headers, params=params)
        logger.debug(f"Places API call successful: {resp}")
        return Place(
            id=resp["places"][0]["name"].split("/")[1],
            name=resp["places"][0]["displayName"]["text"],
            address=resp["places"][0]["formattedAddress"],
            address_components=resp["places"][0]["addressComponents"],
            maps_uri=resp["places"][0]["googleMapsUri"],
            lat=resp["places"][0]["location"]["latitude"],
            lng=resp["places"][0]["location"]["longitude"],
            is_origin = is_origin
        )

    def get_distances(
        self, origin_dest_map: Dict[Place, Place], output="json"
    ) -> TravelMatrix:
        """Gets the travel time and distance between origins and destinations
        
        Origins and destinations should be proper place ids from the Cloud API, not search strings.

        Distance endpoint returns a matrix **in the same order of the request**
        
        https://developers.google.com/maps/documentation/distance-matrix/overview?hl=en_US
        """

        endpoint = self.base_url + f"distancematrix/{output}"

        for origin in origin_dest_map.keys():
            enc_origin = urllib.parse.quote(f"place_id:{origin.id}")
            enc_destinations = urllib.parse.quote(
                "|".join([f"place_id:{dest.id}" for dest in origin_dest_map[origin]])
            )
            url = (
                endpoint
                + f"?origins={enc_origin}&destinations={enc_destinations}&key={self.api_key}"
            )
            resp = self._get(url=url)
            logger.debug(f"Distance API call successful: {resp}")

            journeys = self._parse_journeys(
                origin=origin, destinations=origin_dest_map[origin], resp=resp
            )
        return TravelMatrix(journeys)

    @staticmethod
    def _parse_journeys(
        origin: Place, destinations: List[Place], resp: str
    ) -> List[Journey]:
        journeys, row_count = [], 0
        for destination in destinations:
            journeys.append(
                Journey(
                    origin=origin,
                    destination=destination,
                    travel_time_mins=resp["rows"][0]["elements"][row_count]["duration"][
                        "value"
                    ] // 60,
                )
            )
            row_count += 1
        return journeys
