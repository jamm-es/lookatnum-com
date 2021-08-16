import pandas as pd
import us
import numpy as np

state_pop = pd.read_csv('C:/Users/me/Documents/lookatnum-com/src/covid-map/StatePop.csv')
all_deaths = pd.read_csv('C:/Users/me/Documents/lookatnum-com/src/covid-map/covid_deaths.csv')

state_pop = state_pop.filter(['State', 'Population as of 2020 census [81]'], axis=1)
state_pop = state_pop.drop([48, 51])

fips = all_deaths.filter(['state', 'fips'], axis=1)
fips = fips.drop_duplicates()

state_pop = state_pop.merge(fips, left_on='State', right_on='state', how='left')

deaths = all_deaths[all_deaths['date'] == '2021-08-14']

state_pop = state_pop.merge(deaths, left_on='fips', right_on='fips', how='left')
state_pop['pop'] = state_pop['Population as of 2020 census [81]'].str.replace(',', '').astype(int)

old_deaths = all_deaths[all_deaths['date'] == '2021-07-31']
old_deaths = old_deaths.filter(['fips', 'deaths'], axis=1)
state_pop = state_pop.merge(old_deaths, left_on='fips', right_on='fips', how='left', suffixes=('', '_old'))
state_pop['recent_deaths'] = state_pop['deaths'] - state_pop['deaths_old']
state_pop['ratio'] = state_pop['recent_deaths'] / state_pop['pop']
state_pop['vs_overall'] = state_pop['ratio'] / (state_pop['recent_deaths'].sum() / state_pop['pop'].sum())
state_pop['vs_overall_sqrt'] = np.sqrt(state_pop['vs_overall'])
state_pop = state_pop.filter(['State', 'fips', 'cases', 'deaths', 'pop', 'recent_deaths', 'ratio', 'vs_overall', 'vs_overall_sqrt'], axis=1)
state_pop = state_pop.set_index('fips')
state_pop = state_pop.rename(columns={'State': 'state'})
state_pop['abbrev'] = state_pop['state'].apply(lambda x: us.states.lookup(x).ap_abbr)
state_pop.to_csv('data.csv')