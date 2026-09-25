'use client';
// '내 방': one room system. The 3D room is walked in and decorated directly
// (꾸미기 모드); there is no separate 2D decorating canvas any more. Friends
// who walk in appear live, and the room has its own chat and stickers.
import type { ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import type { LoungeSave } from './lounge-look';
import type { RoomAccess } from './lounge-bedroom-data';
import type { CloudRoom, CloudRoomView } from './lounge-cloud-room';
import { Bedroom3D, type RoomPresence } from './lounge-bedroom-3d';
import { OwnerGuestbook } from './lounge/FriendVisit';
import { preloadRoomAssets } from './lounge-bedroom-scene';
import { defaultBedroom } from './lounge-bedroom-data';

/** Called when I walk up to my door: the room's models start loading. */
export function preloadBedroom(save: LoungeSave) {
  preloadRoomAssets(save.bedroom ?? defaultBedroom(save.actor));
}


export function BedroomEditor(props: {
  save: LoungeSave;
  onChange: (save: LoungeSave) => void;
  notice: (message: string) => void;
  unlocks?: readonly string[];
  presence?: RoomPresence;
  onDecorated?: () => void;
  onAccess?: (access: RoomAccess) => void;
  room?: CloudRoom;
  view?: CloudRoomView;
  onChat?: () => void;
  stickers?: ReactNode;
  onExit?: () => void;
  onDress?: () => void;
  onCook?: () => void;
  spawn?: 'door' | 'bed';
  onNearDoor?: () => void;
}) {
  return (
    <div className="b3-bedroom-experience">
      <Bedroom3D
        key={props.save.actor}
        save={props.save}
        onChange={props.onChange}
        notice={props.notice}
        unlocks={props.unlocks}
        presence={props.presence}
        onDecorated={props.onDecorated}
        onAccess={props.onAccess}
        onExit={props.onExit}
        onDress={props.onDress}
        onCook={props.onCook}
        spawn={props.spawn}
        onNearDoor={props.onNearDoor}
      />
      {(props.onChat || props.stickers || (props.room && props.view)) && (
        <div className="b3-owner-bar">
          {props.onChat && (
            <button type="button" className="b3-chat-button" onClick={props.onChat} data-testid="room-chat">
              <MessageCircle size={17} /> 이 방 수다
            </button>
          )}
          {props.stickers}
          {props.room && props.view && <OwnerGuestbook room={props.room} view={props.view} />}
        </div>
      )}
    </div>
  );
}
