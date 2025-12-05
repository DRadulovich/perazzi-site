import {defineDocuments, defineLocations, type PresentationPluginOptions} from 'sanity/presentation'

export const resolve: PresentationPluginOptions['resolve'] = {
  mainDocuments: defineDocuments([
    {route: '/', filter: `_type == "homeSingleton"`},
    {route: '/shotguns', filter: `_type == "shotgunsLanding"`},
    {route: '/shotguns/ht', filter: `_type == "shotgunsLanding"`},
    {route: '/shotguns/mx', filter: `_type == "shotgunsLanding"`},
    {route: '/shotguns/tm', filter: `_type == "shotgunsLanding"`},
    {route: '/shotguns/dc', filter: `_type == "shotgunsLanding"`},
    {route: '/shotguns/sho', filter: `_type == "shotgunsLanding"`},
    {route: '/shotguns/grades', filter: `_type == "shotgunsLanding"`},
    {route: '/shotguns/disciplines/:slug', filter: `_type == "shotgunsLanding"`},
    {route: '/bespoke', filter: `_type == "bespokeHome"`},
    {route: '/experience', filter: `_type == "experienceHome"`},
    {route: '/heritage', filter: `_type == "heritageHome"`},
    {route: '/service', filter: `_type == "serviceHome"`},
    {route: '/journal', filter: `_type == "journalLanding"`},
    {route: '/journal/:slug', filter: `_type == "article" && slug.current == $slug`},
  ]),
  locations: {
    homeSingleton: defineLocations({
      message: 'Used to render the home page',
      tone: 'positive',
      locations: [{title: 'Home', href: '/'}],
    }),
    shotgunsLanding: defineLocations({
      message: 'Used across the shotguns section',
      tone: 'positive',
      locations: [
        {title: 'Shotguns landing', href: '/shotguns'},
        {title: 'High Tech series', href: '/shotguns/ht'},
        {title: 'MX series', href: '/shotguns/mx'},
        {title: 'TM series', href: '/shotguns/tm'},
        {title: 'SCO/SO series', href: '/shotguns/sho'},
        {title: 'DC series', href: '/shotguns/dc'},
        {title: 'Grades overview', href: '/shotguns/grades'},
      ],
    }),
    bespokeHome: defineLocations({
      message: 'Used on the bespoke journey page',
      tone: 'positive',
      locations: [{title: 'Bespoke', href: '/bespoke'}],
    }),
    experienceHome: defineLocations({
      message: 'Used on the experience page',
      tone: 'positive',
      locations: [{title: 'Experience', href: '/experience'}],
    }),
    heritageHome: defineLocations({
      message: 'Used on the heritage page',
      tone: 'positive',
      locations: [{title: 'Heritage', href: '/heritage'}],
    }),
    serviceHome: defineLocations({
      message: 'Used on the service page',
      tone: 'positive',
      locations: [{title: 'Service', href: '/service'}],
    }),
    journalLanding: defineLocations({
      message: 'Used for the journal index',
      tone: 'positive',
      locations: [{title: 'Journal index', href: '/journal'}],
    }),
    article: defineLocations({
      select: {
        title: 'title',
        slug: 'slug.current',
      },
      resolve: (doc) => {
        const articleLocations = doc?.slug
          ? [{title: doc.title || 'Journal article', href: `/journal/${doc.slug}`}]
          : [];
        return {
          locations: [...articleLocations, {title: 'Journal index', href: '/journal'}],
        };
      },
    }),
  },
}
