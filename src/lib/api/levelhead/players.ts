import {default as RumpusCE, DelegationOptions} from "../../RumpusCE";
import {cleanQuery} from "../../utility";
import {
  LevelheadPlayerDownload,
  LevelheadPlayer,
  LevelheadPlayerSearch,
  ListedUserId
} from "./players.d";
import {
  ListedLevelId
} from "./levels.d";
import {ResultsPage, blankResultsPage} from "..";

export type LevelheadPlayerLikesSearch = {
  limit?:number,
  levelIds?:string|string[],
  beforeId?:string
}

async function getLevelheadPlayerLevelList(this:RumpusCE
  , listType: 'likes'|'favorites'
  , userId: string
  , query?: LevelheadPlayerLikesSearch
  , options?: DelegationOptions
){
  const res = await this.get(`/api/levelhead/players/${userId}/${listType}`,{
    ...options,
    query:cleanQuery(query)
  });
  if(res.status==200){
    const levels = res.data as ResultsPage<ListedLevelId>;
    const lastId = levels.length && (!query?.limit || query.limit == levels.length)
      ? levels[levels.length-1]._id
      : false ;
    levels.nextPage = ()=>{
      if(lastId){
        const newQuery = {...query,beforeId:lastId};
        return getLevelheadPlayerLevelList.bind(this)(listType,userId,newQuery,options);
      }
      return blankResultsPage();
    };
    return levels;
  }
  else{
    throw new Error(`Level ${listType} failed with status ${res.status}`);
  }
}

/** Get the list of levels liked by a user. */
export async function getLevelheadLikedLevels(this:RumpusCE
  , userId: string
  , query?: LevelheadPlayerLikesSearch
  , options?: DelegationOptions
){
  return getLevelheadPlayerLevelList.call(this,'likes',userId,query,options);
}

/** Get the list of levels favorited by a user. */
export async function getLevelheadFavoritedLevels(this:RumpusCE
  , userId: string
  , query?: LevelheadPlayerLikesSearch
  , options?: DelegationOptions
){
  return getLevelheadPlayerLevelList.call(this,'favorites',userId,query,options);
}

export type LevelheadPlayerFollowsSearch = {
  limit?:number,
  userIds?:string|string[],
  beforeId?:string,
  includeAliases?:boolean
};

async function getLevelheadPlayerFollows(this:RumpusCE
  , listType: 'following'|'followers'
  , userId: string
  , query?: LevelheadPlayerFollowsSearch
  , options?: DelegationOptions
){
  const res = await this.get(`/api/levelhead/players/${userId}/${listType}`,{
    ...options,
    query:cleanQuery(query)
  });
  if(res.status==200){
    const players = res.data as ResultsPage<ListedUserId>;
    const lastId = players.length && (!query?.limit || query.limit == players.length)
      ? players[players.length-1]._id
      : false ;
    players.nextPage = ()=>{
      if(lastId){
        const newQuery = {...query,beforeId:lastId};
        return getLevelheadPlayerFollows.bind(this)(listType,userId,newQuery,options);
      }
      return blankResultsPage();
    };
    return players;
  }
  else{
    throw new Error(`Player ${listType} search failed with status ${res.status}`);
  }
}

/** Get the list of users following a given user. */
export async function getLevelheadPlayerFollowers(this:RumpusCE
  , userId: string
  , query?: LevelheadPlayerFollowsSearch
  , options?: DelegationOptions
){
  return getLevelheadPlayerFollows.call(this,'followers',userId,query,options);
}

/** Get the list of users followed by a given user. */
export async function getLevelheadPlayerFollowing(this:RumpusCE
  , userId: string
  , query?: LevelheadPlayerFollowsSearch
  , options?: DelegationOptions
){
  return getLevelheadPlayerFollows.call(this,'following',userId,query,options);
}

function addPlayerFunctionality(client:RumpusCE
  , player: LevelheadPlayerDownload
){
  const fancyPlayer = player as LevelheadPlayer ;

  fancyPlayer.getLikedLevels = (
    query?: LevelheadPlayerLikesSearch,
    options?: DelegationOptions
  )=>getLevelheadLikedLevels.call(client,player.userId,query,options);

  fancyPlayer.getFavoritedLevels = (
    query?: LevelheadPlayerLikesSearch,
    options?: DelegationOptions
  )=>getLevelheadFavoritedLevels.call(client,player.userId,query,options);

  fancyPlayer.getFollowers = (
    query?: LevelheadPlayerFollowsSearch,
    options?: DelegationOptions
  )=>getLevelheadPlayerFollowers.call(client,player.userId,query,options);

  fancyPlayer.getFollowing = (
    query?: LevelheadPlayerFollowsSearch,
    options?: DelegationOptions
  )=>getLevelheadPlayerFollowing.call(client,player.userId,query,options);

  return fancyPlayer;
}

export async function getLevelheadPlayers(this:RumpusCE
  , query?: LevelheadPlayerSearch
  , options?: DelegationOptions
){
  const res = await this.get(`/api/levelhead/players`,{
    ...options,
    query:cleanQuery(query)
  });
  if(res.status==200){
    const players = res.data as LevelheadPlayerDownload[];
    return players.map(player=>addPlayerFunctionality(this,player));
  }
  else{
    throw new Error(`Player search failed with status ${res.status}`);
  }
}