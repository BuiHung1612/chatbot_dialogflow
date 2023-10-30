import React, {useState, useCallback, useEffect} from 'react';
import {
  PermissionsAndroid,
  SafeAreaView,
  Platform,
  Button,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import {GiftedChat, IMessage} from 'react-native-gifted-chat';
import Voice, {
  SpeechEndEvent,
  SpeechErrorEvent,
  SpeechRecognizedEvent,
  SpeechResultsEvent,
  SpeechStartEvent,
} from '@react-native-voice/voice';

const App = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isStartedMicro, setIsStartedMicro] = useState(false);

  const requestMicro = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        console.log('write external stroage', grants);

        if (
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.RECORD_AUDIO'] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Permissions granted');
        } else {
          console.log('All required permissions not granted');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }
  };

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStart = (e: SpeechStartEvent) => {
    console.log('onSpeechStart', e);
  };
  const onSpeechRecognized = (e: SpeechRecognizedEvent) => {
    console.log('onSpeechRecognized', e);
  };
  const onSpeechEnd = (e: SpeechEndEvent) => {
    console.log('SpeechEndEvent', e);
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    console.log('onSpeechError', e);
  };
  const onSpeechResults = (e: SpeechResultsEvent) => {
    console.log('onSpeechResults', e);
    setIsStartedMicro(false);
    if (e != null && e.value != null) {
      const messages = [
        {
          _id: Date.now(),
          text: e.value[0],
          createdAt: Date.now(),
          user: {
            _id: 1,
            name: 'Me',
          },
        },
      ];
      onSend(messages);
      sendRequest(messages[0]);
    }
  };
  useEffect(() => {
    if (Platform.OS === 'android') {
      requestMicro();
    }
  }, []);

  const sendRequest = useCallback(async (m: IMessage) => {
    fetch(
      'https://console.dialogflow.com/v1/integrations/messenger/webhook/0bc163be-2619-40bb-a99d-32499efe36e7/sessions/webdemo-ff974fda-a864-5aca-7190-f8b83f087408?platform=webdemo',
      // 'https://dialogflow.googleapis.com/v2/projects/chatbot-test02-qum9/agent/sessions/ca228a8c-9490-51ed-5ade-c0a01c6c305a:detectIntent',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-type': 'application/json',
          accept: '*/*',
          authority: 'console.dialogflow.com',
          origin: 'https://console.dialogflow.com',
          'sec-ch-ua':
            "'Chromium';v='118', 'Google Chrome';v='118','Not=A?Brand';v='99'",
          'sec-ch-ua-arch': 'arm',
          'sec-ch-ua-bitness': '64',
          'sec-ch-ua-full-version': '118.0.5993.70',
          'sec-ch-ua-full-version-list':
            "'Chromium';v='118.0.5993.70', 'Google Chrome';v='118.0.5993.70', 'Not=A?Brand';v='99.0.0.0'",
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-model': '',
          'sec-ch-ua-platform': 'macOS',
          'sec-ch-ua-platform-version': '13.4.1',
          'sec-ch-ua-wow64': '?0',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        },

        body: JSON.stringify({
          queryInput: {
            text: {
              text: m.text,
              languageCode: 'vi',
            },
          },
        }),
      },
    )
      .then(response => response.text())
      .then(json => {
        if (typeof json === 'string') {
          const replaced = json.replace(")]}'", '');
          const parsed = JSON.parse(replaced);

          if (parsed?.queryResult != null) {
            setMessages(previousMessages =>
              GiftedChat.append(previousMessages, [
                {
                  text: parsed?.queryResult?.fulfillmentText,
                  user: {
                    _id: 2,
                    avatar:
                      'https://avatars.githubusercontent.com/u/8170782?s=280&v=4',
                  },
                  createdAt: new Date(),
                  _id: Date.now(),
                },
              ]),
            );
          }
        }
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  const onSend = useCallback(
    (m: IMessage[]) => {
      const filtered = m.filter(e => e.user._id === 1);
      sendRequest(filtered[filtered.length - 1]);
      setMessages(previousMessages => GiftedChat.append(previousMessages, m));
    },
    [sendRequest],
  );

  const onRecord = async () => {
    if (isStartedMicro) {
      await Voice.stop();
      setIsStartedMicro(false);
    } else {
      const isAvailable = await Voice.isAvailable();
      if (isAvailable) {
        await Voice.start('vi-VN');
        setIsStartedMicro(true);
      }
    }
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <Button title="Voice Record" onPress={onRecord} />
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: 1,
          name: 'Me',
          avatar:
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzIdr7HcfjPdwSAGPtaGRxlaM7d-PaAJdX9Q&usqp=CAU',
        }}
        textInputProps={{
          color: 'red',
        }}
      />
      {isStartedMicro && (
        <View style={[StyleSheet.absoluteFill, styles.container]}>
          <Text style={styles.recordTxt}>Đang ghi âm...</Text>
          <Button title="Dừng ghi âm" onPress={onRecord} />
        </View>
      )}
    </SafeAreaView>
  );
};

export default App;
const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordTxt: {fontSize: 30, color: 'white', marginBottom: 40},
});
