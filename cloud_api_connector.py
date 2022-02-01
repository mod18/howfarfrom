import requests
import urllib.parse
from time import sleep
from typing import List, Dict

from constants import CLOUD_API_KEY

class CloudApiConnector:
    """Connects to the Cloud API"""

    def __init__(
        self,
        api_key=CLOUD_API_KEY,
        base_url="https://maps.googleapis.com/maps/api/",
    ):
        self.base_url = base_url
        self.api_key = api_key

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
                print(f"Failed to the Cloud API. Retrying...({attempts} / 5")
                sleep(attempts * attempts)
            except requests.HTTPError as e:
                print(f"{response.status_code} Error: {e}")
                sleep(attempts * attempts)                
            else:
                return response.json()
            finally:
                attempts += 1

    def get_place_id(self, query: str, output="json") -> str:
        """Gets a place_id from a search string
        
        https://developers.google.com/maps/documentation/places/web-service/search-find-place?hl=en_US

        """
        if not isinstance(query, str):
            print("Query must be a string")
            return

        endpoint = self.base_url + f"place/findplacefromtext/{output}"
        input = urllib.parse.quote(query)
        inputtype = "textquery"
        fields = "place_id"
        url = endpoint + f"?input={input}&inputtype={inputtype}&fields={fields}&key={self.api_key}"
        resp = self._get(url=url)
        return resp[0]["place_id"]
