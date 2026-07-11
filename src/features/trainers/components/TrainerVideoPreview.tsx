import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

interface Props {
  videoUrl: string;
}

export function TrainerVideoPreview({ videoUrl }: Props) {
  const [fullscreen, setFullscreen] = useState(false);

  const player = useVideoPlayer(videoUrl);

  return (
    <>
      <View style={styles.container}>
        <VideoView player={player} style={styles.video} nativeControls={true} contentFit="cover" />

        <Pressable
          style={styles.expandButton}
          onPress={() => {
            setFullscreen(true);
            player.play();
          }}
        >
          <Ionicons name="expand" size={20} color="#fff" />
        </Pressable>
      </View>

      <Modal visible={fullscreen} animationType="slide">
        <View style={styles.fullscreenContainer}>
          <Pressable
            style={styles.closeButton}
            onPress={() => {
              setFullscreen(false);
              player.pause();
            }}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>

          <VideoView
            player={player}
            style={styles.fullscreenVideo}
            nativeControls={true}
            contentFit="contain"
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginTop: 18,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  expandButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 50,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  fullscreenVideo: {
    width: '100%',
    height: 300,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 100,
  },
});
