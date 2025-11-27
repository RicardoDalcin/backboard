import { ptBR } from './pt-br';
type Resource = typeof ptBR;

export const enUS: Resource = {
  translation: {
    global: {
      cancel: 'Cancel',
      share: 'Share view',
      export: 'Export',
      clear: 'Clear',
      all: 'All',
      apply: 'Apply',
      select: 'Select',
      rename: 'Rename',
      delete: 'Delete',
      noResults: 'No results',
      copiedLink: 'Link copied',
    },
    select: {
      selectOptions: 'Select options',
      clearAllSelected: 'Clear all selected',
      optionsSelected: 'options selected',
      noResultsFound: 'No results found',
      search: 'Search...',
    },
    menu: {
      explore: 'Explore',
      compare: 'Compare',
      about: 'About',
    },
    settings: {
      title: 'Settings',
      storageUsage: 'NBA shot data is using <bold>{{size}}</bold> of storage.',
      storageDisclaimer:
        'This storage is used to make the offline-first experience possible.',
      hasNotOptedIn:
        'You have not opted in to download the data and use the app.',
      clearStorage: {
        title: 'Clear storage',
        description:
          'Are you sure you want to delete app data? This will only affect data and it will not delete your custom filters.',
        confirm: 'Delete data',
      },
      language: 'Language',
    },
    welcome: {
      notSupported: {
        title: 'Browser version not supported',
        description:
          'Unfortunately, the browser version you are using is not supported by the platform. To make the experience work properly, Backboard requires a newer version. We apologize for the inconvenience.',
        minimumRequisites: 'Minimum requisites',
      },
      title: 'Welcome to Backboard',
      aboutBackboard:
        'Backboard in an offline-first data visualization dashboard for exploring, analyzing and comparing NBA shot data.',
      offlineFirst:
        'Since this is an offline-first experience, if you choose to continue the app will download the data and save it locally in your browser.',
      connectionDisclaimer:
        "This process shouldn't take long, but please make sure you have a stable internet connection (download is about 150mb). You can delete the data at any time in the settings menu on the top right corner.",
      continue: 'Continue to the dashboard',
    },
    setup: {
      downloading: 'Downloading data...',
      initializing: 'Initializing dashboard...',
    },
    about: {
      title: 'About Backboard',
      openSource:
        'It is entirely open-source, so feel free to check out the <anchor>source code</anchor> and contribute to the project. The stack used is React, Tailwind and to make offline fast queries possible the WASM port of SQLite was used with the Origin-Private File System API.',
    },
    explore: {
      loadingShots: 'Loading shots...',
      exploringShots: 'Exploring {{count, number}} shots',
      volume: 'Volume',
      efficiency: 'Efficiency',
      teams: 'Teams',
      players: 'Players',
      fgVsLeagueAverage: 'FG% vs. league average',
      volumeLowToHigh: 'Volume: low to high',
    },
    compare: {
      title: 'Compare',
      addPanel: 'Add panel',
      panel: {
        noFilterSelected: 'No filter selected. Use a preset to continue.',
        selectPreset: 'Select preset',
        closePanel: 'Close panel',
      },
    },
    filters: {
      name: 'Name',
      saveChanges: 'Save changes',
      newFilter: 'New filter',
      editFilter: 'Edit filter',
      createFilter: 'Create filter',
      saveAsNewFilter: 'Save as new filter',
      filterExample: 'e.g. "2023-24 Season"',
      season: 'Season',
      teams: 'Teams',
      teamsSelected: 'teams selected',
      players: 'Players',
      playersSelected: 'players selected',
      drtgRanking: 'DRTG Ranking',
      drtgRankingTooltip:
        'DRTG ranking of the opposing team during the month of the game.',
      ortgRanking: 'ORTG Ranking',
      ortgRankingTooltip:
        'ORTG ranking of the team during the month of the game.',
      positions: 'Positions',
      result: 'Result',
      wins: 'Wins',
      losses: 'Losses',
    },
    basketball: {
      stats: {
        eFG: {
          title: 'Effective Field Goal %: (2PM + (1.5 * 3PM)) / FGA.',
          description: 'Takes into account the extra value of 3-pointers.',
        },
        twoPointer: '2PT shots',
        threePointer: '3PT shots',
        player: 'Player',
        team: 'Team',
        total: 'Shots',
        shots: 'Shots',
      },
      zones: {
        aboveBreak3: 'Above Break 3',
        restrictedArea: 'Restricted Area',
        midRange: 'Mid-Range',
        leftCorner3: 'Left Corner 3',
        paintNonRa: 'Paint (Non-RA)',
        rightCorner3: 'Right Corner 3',
        backcourt: 'Backcourt',
      },
      conferences: {
        eastern: 'Eastern',
        western: 'Western',
      },
    },
  },
};
