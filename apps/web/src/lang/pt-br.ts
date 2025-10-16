export const ptBR = {
  translation: {
    global: {
      cancel: 'Cancelar',
      share: 'Compartilhar',
      export: 'Exportar',
      clear: 'Limpar',
      all: 'Todos',
      apply: 'Aplicar',
      select: 'Selecionar',
      rename: 'Renomear',
      delete: 'Deletar',
    },
    menu: {
      explore: 'Explorar',
      compare: 'Comparar',
      about: 'Sobre',
    },
    settings: {
      title: 'Configurações',
      storageUsage:
        'Dados de arremesso estão usando <bold>{{size}}</bold> de armazenamento.',
      storageDisclaimer:
        'Os dados são usados para tornar a experiência offline-first possível.',
      hasNotOptedIn:
        'Você ainda não aceitou baixar os dados e usar o aplicativo.',
      clearStorage: {
        title: 'Limpar dados',
        description:
          'Você tem certeza que deseja limpar os dados do aplicativo? Isso irá remover somente os dados e não irá apagar seus filtros customizados.',
        confirm: 'Deletar dados',
      },
    },
    welcome: {
      title: 'Bem-vindo ao Backboard',
      aboutBackboard:
        'Backboard é um dashboard de visualização de dados offline-first para explorar, analisar e comparar dados de arremessos da NBA.',
      offlineFirst:
        'Como essa é uma experiência offline-first, se você escolher continuar o aplicativo vai baixar os dados e salvá-los localmente no seu browser.',
      connectionDisclaimer:
        'Esse processo não deve demorar muito, mas certifique-se de ter uma conexão estável (o download é de ~150mb). Você pode apagar os dados a qualquer momento no menu de configurações no topo superior direito.',
      continue: 'Continuar para o dashboard',
    },
    setup: {
      downloading: 'Baixando dados...',
      initializing: 'Inicializando dashboard...',
    },
    about: {
      title: 'Sobre o Backboard',
      openSource:
        'O projeto é totalmente open-source, então fique à vontade para conferir o <anchor>código fonte</anchor> e contribuir com o projeto. A stack usada é React, Tailwind e para tornar possível consultas rápidas offline foi utilizado a versão WASM do SQLite com a API Origin-Private File System.',
    },
    explore: {
      loadingShots: 'Carregando arremessos...',
      exploringShots: 'Explorando {{count, number}} arremessos',
    },
    compare: {
      title: 'Comparar',
      addPanel: 'Adicionar painel',
      panel: {
        noFilterSelected:
          'Nenhum filtro selecionado. Use um preset para continuar.',
        selectPreset: 'Selecionar preset',
        closePanel: 'Fechar painel',
      },
    },
    filters: {
      name: 'Nome',
      saveChanges: 'Salvar alterações',
      editFilter: 'Editar filtro',
      createFilter: 'Criar filtro',
      saveAsNewFilter: 'Salvar como novo filtro',
      filterExample: 'ex. "Temporada 2023-24"',
      season: 'Temporada',
      teams: 'Times',
      players: 'Jogadores',
      drtgRanking: 'Ranking Defensivo',
      drtgRankingTooltip:
        'Ranking defensivo do time adversário durante o mês da partida.',
      ortgRanking: 'Ranking Ofensivo',
      ortgRankingTooltip:
        'Ranking ofensivo do time atacante durante o mês da partida.',
      positions: 'Posições',
      result: 'Resultado',
      wins: 'Vitórias',
      losses: 'Derrotas',
    },
  },
};
