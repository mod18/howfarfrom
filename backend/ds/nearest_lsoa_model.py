import pandas as pd
import numpy as np
from math import mean, isnan
from statistics import variance, median
from sklearn.neighbors import BallTree


class Lsoa:
    def __init__(self, id, name, raw_rank, pctile, decile, lat, lng, k):
        self.id = id
        self.name = name
        self.raw_rank = raw_rank
        self.pctile = pctile
        self.decile = decile
        self.lat = lat
        self.lng = lng
        self.k = k
        self.k_nearest = []
        self.pctile_stats, self.decile_stats = {}, {}

    def to_dict(self):
        return {
            'name': self.name,
            'lat': self.lat,
            'lng': self.lng,
            'raw_rank': self.raw_rank,
            'pctile': self.pctile,
            'decile': self.decile,
            'pctile_stats': self.pctile_stats,
            'decile_stats': self.decile_stats
        }
    
    def update_nearest(self, nearest):
        for neighbor in nearest:
            if neighbor.id != self.id:
                self.k_nearest.append(neighbor)

    def get_nearest_stats(self):
        pctile, decile = [other.pctile for other in self.k_nearest], [other.decile for other in self.k_nearest]
        self.pctile_stats, self.decile_stats = {'avg': mean(pctile),'var': variance(pctile), 'min': min(pctile), 'max': max(pctile)}, \
                                               {'avg': mean(decile),'var': variance(decile), 'min': min(decile), 'max': max(decile)} 

def run_knn_lsoa():
    imd_data = pd.read_csv("uk_imd2019.csv")
    boundaries_ew = pd.read_csv("lsoa_boundaries.csv")
    postcode_lookup = pd.read_csv("postcode_to_lsoa.csv", low_memory=False)

    postcode_lookup.set_index('lsoa11cd', inplace=True)

    imd_lsoa = imd_data.join(boundaries_ew)

    lsoas = []
    for row in imd_lsoa.iterrows():
        new_lsoa = Lsoa(row[0], row[1]['LSOA'], row[1]['Rank'], row[1]['SOA_pct'], row[1]['SOA_decile'], row[1]['LAT'], row[1]['LONG_'], 5)
        lsoas.append(new_lsoa)

    points, lookup = [], {}
    for lsoa in lsoas:
        if isnan(lsoa.lat):
            pass
        else:
            points.append([lsoa.lat, lsoa.lng])
            lookup[(lsoa.lat, lsoa.lng)] = lsoa
    points = np.array(points)

    tree = BallTree(points, metric='haversine')
    _, ind = tree.query(points, 6)
    for id in range(len(points)):
        lsoa = lookup[tuple(points[id])]
        nearest = [lookup[tuple(points[neighbor])] for neighbor in ind[id]]
        lsoa.update_nearest(nearest)

    for lsoa in lsoas:
        if len(lsoa.k_nearest) > 0:
            lsoa.get_nearest_stats()

    lsoa_out = pd.DataFrame.from_dict({lsoa.id: lsoa.to_dict() for lsoa in lsoas}, orient='index')
    lsoa_out.set_index('name', inplace=True)
    joined = lsoa_out.join(postcode_lookup, how='left')

    final = joined[['raw_rank', 'pctile', 'decile', 'pctile_stats', 'decile_stats', 'pcds', 'lat', 'lng']]
    final.reset_index(inplace=True)
    final = final.rename(columns={'pcds': 'postcode'})
    final.to_csv('imd_data_out.csv')