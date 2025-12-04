import { useRef, useState, useEffect } from 'react';
import { Button, Input, message } from 'antd';
// import { useWebRTC } from '@/hooks/liveVideo/useWebRTC';

export default function LiveViewer() {
  const [roomId, setRoomId] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="w-800 h-540 flex  justify-center items-center bg-black rounded-tl-5 rounded-tr-5 flex-col">
      <div className="w-99.8% h-50 bg-white mb-8 rounded-tl-5 rounded-tr-5 flex items-center justify-between p-4">
        <div>
          <h3 className="text-16 font-bold">观看直播</h3>
          {isJoined && (
            <span className="text-11 text-green-500">
              在线观众:
              {/* {viewers} */}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!isJoined ? (
            <>
              <Input
                placeholder="输入房间ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                // onPressEnter={handleJoinRoom}
              />
              <Button
                type="primary"
                // onClick={handleJoinRoom}
                // disabled={!isConnected}
              >
                加入房间
              </Button>
            </>
          ) : (
            <Button
            // onClick={handleLeaveRoom}
            >
              离开房间
            </Button>
          )}
        </div>
      </div>

      <div className="video w-99.8% h-470 bg-white">
        <video
          className="w-full h-full object-contain"
          ref={videoRef}
          autoPlay
          playsInline
        />
      </div>
    </div>
  );
}
