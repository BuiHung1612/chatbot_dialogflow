import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  SafeAreaView,
  PermissionsAndroid,
  Platform,
  Button,
  EmitterSubscription,
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
  const [showRecordButton, setShowRecordButton] = useState(false);
  const [isStartedMicro, setIsStartedMicro] = useState(false);
  const recordEventListenner = useRef<EmitterSubscription>();
  const requestMicro = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Cool Photo App Camera Permission',
          message:
            'Cool Photo App needs access to your camera ' +
            'so you can take awesome pictures.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setShowRecordButton(true);
        console.log('You can use the micro');
      } else {
        setShowRecordButton(false);
        console.log('Micro permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;

    // Voice.onSpeechPartialResults = onSpeechPartialResults;
    // Voice.onSpeechVolumeChanged = onSpeechVolumeChanged;

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
  };
  useEffect(() => {
    if (Platform.OS === 'android') {
      requestMicro();
    }
  }, []);

  useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: 'Hello developer',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'React Native',
          avatar: 'https://placeimg.com/140/140/any',
        },
      },
    ]);
  }, []);
  const sendRequest = (m: IMessage) => {
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
  };

  const onSend = useCallback((m: IMessage[]) => {
    const filtered = m.filter(e => e.user._id === 1);
    sendRequest(filtered[filtered.length - 1]);
    setMessages(previousMessages => GiftedChat.append(previousMessages, m));
  }, []);

  useEffect(() => {}, []);
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
      {showRecordButton && (
        <Button
          title={isStartedMicro ? 'Đang ghi âm...' : 'Bắt đầu ghi âm'}
          onPress={onRecord}
        />
      )}
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: 1,
        }}
        textInputProps={{
          color: 'red',
        }}
      />
    </SafeAreaView>
  );
};

export default App;
