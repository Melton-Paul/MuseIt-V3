import authContext from "./auth-context";
import React from "react";

interface song {
  name: string;
  id: string;
  img: string;
  desc: string;
  artist: string;
  mp3: string;
  queue?: song[];
}

const songIntitial: song = {
  name: "",
  id: "",
  img: "",
  desc: "",
  artist: "",
  mp3: "",
};

const userDataContext = React.createContext({
  recents: [songIntitial],
  playlists: [{ name: "", songs: [songIntitial] }],
  playSong: (obj: song, hover?: boolean) => {},
  setPlaylist: (mame: string, songs: song[]) => {},
  setView: (mame: string, songs: song[]) => {},
  currentPlaylist: { name: "", songs: [songIntitial] },
  currentView: { name: "", songs: [songIntitial] },
  song: songIntitial,
  addPlaylist: (name: string, song: song) => {},
  removePlaylist: (name: string) => {},
  removeSong: (songId: string) => {},
  resetData: () => {},
});

let firstRender = true;

export const UserDataContextProvider: React.FC<{
  children: React.ReactNode;
}> = (props) => {
  const [recentlyPlayed, setRecentlyPlayed] = React.useState<song[]>([]);

  const [playlists, setPlaylists] = React.useState<
    {
      name: string;
      songs: song[];
    }[]
  >([]);
  const [song, setSong] = React.useState(songIntitial);
  const [currentPlaylist, setCurrentPlaylist] = React.useState<{
    name: string;
    songs: song[];
  }>({ name: "", songs: [] });

  const [currentView, setCurrentView] = React.useState<{
    name: string;
    songs: song[];
  }>({ name: "", songs: [] });
  const authCtx = React.useContext(authContext);

  function playSong(obj: song, hover?: boolean) {
    if (obj.queue) {
      setSong(obj.queue[0]);
      if (!hover) {
        addRecentlyPlayed(obj.queue[0]);
      }
    } else {
      setSong(obj);
      if (!hover) {
        addRecentlyPlayed(obj);
      }
    }
  }

  function addRecentlyPlayed(obj: song) {
    console.log("Ran");
    if (recentlyPlayed.some((song) => song.id === obj.id)) {
      setRecentlyPlayed((prev) => prev.filter((songs) => songs.id !== obj.id));
      setRecentlyPlayed((prev) => [obj, ...prev]);
      return;
    }
    if (recentlyPlayed.length >= 6) {
      setRecentlyPlayed((prev) => {
        const arr = prev;
        arr.pop();
        return [obj, ...arr];
      });
    } else {
      setRecentlyPlayed((prev) => [obj, ...prev]);
    }
  }

  function setPlaylist(name: string, songs: song[]) {
    setCurrentPlaylist({ name, songs });
  }
  function setView(name: string, songs: song[]) {
    setCurrentView({ name, songs });
  }

  function addPlaylist(name: string, song: song) {
    if (
      playlists.some(
        (playlist) => playlist.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      setPlaylists((prev) => {
        return prev.map((playlist) => {
          return playlist.name.toLowerCase() === name.toLowerCase()
            ? playlist.songs.some(
                (playlistSong) => playlistSong.name === song.name
              )
              ? playlist
              : { ...playlist, songs: [...playlist.songs, song] }
            : playlist;
        });
      });
    } else {
      setPlaylists((prev) => {
        return [...prev, { name: name, songs: [song] }];
      });
    }
  }

  function removePlaylist(name: string) {
    setPlaylists((prev) => {
      return prev.filter((playlist) => playlist.name !== name);
    });
  }

  function removeSong(songId: string) {
    setPlaylists((prev) => {
      return prev.map((playlist) => {
        return playlist.name === currentView.name
          ? {
              ...playlist,
              songs: playlist.songs.filter((songs) => songs.id !== songId),
            }
          : playlist;
      });
    });
    setPlaylists((prev) =>
      prev.filter((playlists) => playlists.songs.length !== 0)
    );

    setCurrentView((prev) => ({
      ...prev,
      songs: prev.songs.filter((song) => song.id !== songId),
    }));
  }
  function resetData() {
    setRecentlyPlayed([]);
    setPlaylists([]);
    setSong(songIntitial);
  }

  React.useEffect(() => {
    if (authCtx.userId || firstRender) {
      return;
    }

    setSong(songIntitial);
    setRecentlyPlayed([]);
    setPlaylists([]);
    firstRender = true;
  }, [authCtx.userId]);

  React.useEffect(() => {
    if (
      !authCtx.userId ||
      firstRender ||
      recentlyPlayed.length === 0 ||
      authCtx.isDeveloper
    ) {
      return;
    }

    fetch(
      `https://musicapp-ae1d2-default-rtdb.firebaseio.com/${authCtx.userId}.json`,
      {
        method: "PUT",
        body: JSON.stringify({ recents: recentlyPlayed, playlists: playlists }),
      }
    );
  }, [authCtx.userId, recentlyPlayed, playlists, authCtx.isDeveloper]);

  React.useEffect(() => {
    if (!authCtx.userId || !firstRender) {
      return;
    }
    firstRender = false;

    fetch(
      `https://musicapp-ae1d2-default-rtdb.firebaseio.com/${authCtx.userId}.json`
    )
      .then((res) => res.json())
      .then((data) => {
        for (let song in data.recents) {
          if (
            recentlyPlayed.some((songs) => songs.id === data.recents[song].id)
          ) {
            continue;
          }
          setRecentlyPlayed((prev) => [...prev, data.recents[song]]);
        }
        for (let playlist in data.playlists) {
          if (
            playlists.some(
              (list) => list.name === data.playlists[playlist].name
            )
          ) {
            continue;
          }
          setPlaylists((prev) => [...prev, data.playlists[playlist]]);
        }
      });
  }, [authCtx.userId, recentlyPlayed, playlists]);

  const contextValues = {
    recents: recentlyPlayed,
    setPlaylist,
    setView,
    playlists,
    addPlaylist,
    removePlaylist,
    removeSong,
    resetData,
    currentPlaylist,
    currentView,
    playSong,
    song,
  };

  return (
    <userDataContext.Provider value={contextValues}>
      {props.children}
    </userDataContext.Provider>
  );
};

export default userDataContext;
