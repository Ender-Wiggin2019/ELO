import {CardName} from '../../CardName';
import {GameModule} from '../../GameModule';
import {CardManifest} from '../CardManifest';
import {AgricolaInc} from './AgricolaInc';
import {Incite} from './Incite';
import {Playwrights} from './Playwrights';
import {ProjectWorkshop} from './ProjectWorkshop';
import {ResearchGrant} from './ResearchGrant';
import {ValuableGases} from './ValuableGases';
import {VenusFirst} from './VenusFirst';
import {AerospaceMission} from './AerospaceMission';
import {TradeAdvance} from './TradeAdvance';
import {PoliticalUprising} from './PoliticalUprising';
import {ByElection} from './ByElection';
import {Midas} from './Midas';
import {ColonialOne} from './ColonialOne';
import {Hotsprings} from './Hotsprings';
import {JunkVentures} from './JunkVentures';
import {Aristarchus} from './Aristarchus';
import {LabourUnion} from './LabourUnion';
import {UnitedNationsMissionOne} from './UnitedNationsMissionOne';
import {AccumulatedKnowledge} from './AccumulatedKnowledge';
import {NitrateReducers} from './NitrateReducers';
import {VitalColony} from './VitalColony';
import {CuriosityII} from './CuriosityII';

export const COMMUNITY_CARD_MANIFEST = new CardManifest({
  module: GameModule.Community,
  projectCards: [],
  corporationCards: [
    {cardName: CardName.AGRICOLA_INC, Factory: AgricolaInc},
    {cardName: CardName.PROJECT_WORKSHOP, Factory: ProjectWorkshop},
    {cardName: CardName.INCITE, Factory: Incite, compatibility: GameModule.Turmoil},
    {cardName: CardName.PLAYWRIGHTS, Factory: Playwrights},
    {cardName: CardName.CURIOSITY_II, Factory: CuriosityII},
    {cardName: CardName.MIDAS, Factory: Midas},
    {cardName: CardName.COLONIAL_ONE, Factory: ColonialOne, compatibility: GameModule.Colonies},
    {cardName: CardName.HOTSPRINGS, Factory: Hotsprings},
    {cardName: CardName.JUNK_VENTURES, Factory: JunkVentures},
    {cardName: CardName.ARISTARCHUS, Factory: Aristarchus},
    {cardName: CardName.LABOUR_UNION, Factory: LabourUnion},
    {cardName: CardName.UNITED_NATIONS_MISSION_ONE, Factory: UnitedNationsMissionOne},

  ],
  preludeCards: [
    {cardName: CardName.RESEARCH_GRANT, Factory: ResearchGrant},
    {
      cardName: CardName.VALUABLE_GASES,
      Factory: ValuableGases,
      compatibility: GameModule.Venus,
    },
    {
      cardName: CardName.VENUS_FIRST,
      Factory: VenusFirst,
      compatibility: GameModule.Venus,
    },
    {
      cardName: CardName.AEROSPACE_MISSION,
      Factory: AerospaceMission,
      compatibility: GameModule.Colonies,
    },
    {
      cardName: CardName.TRADE_ADVANCE,
      Factory: TradeAdvance,
      compatibility: GameModule.Colonies,
    },
    {
      cardName: CardName.POLITICAL_UPRISING,
      Factory: PoliticalUprising,
      compatibility: GameModule.Turmoil,
    },
    {
      cardName: CardName.BY_ELECTION,
      Factory: ByElection,
      compatibility: GameModule.Turmoil,
    },
    {
      cardName: CardName.ACCUMULATED_KNOWLEDGE,
      Factory: AccumulatedKnowledge,
    },
    {
      cardName: CardName.NITRATE_REDUCERS,
      Factory: NitrateReducers,
      compatibility: GameModule.Venus,
    },
    {
      cardName: CardName.VITAL_COLONY,
      Factory: VitalColony,
      compatibility: GameModule.Colonies,
    },
  ],
});
