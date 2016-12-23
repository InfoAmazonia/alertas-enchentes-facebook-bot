## Setup greeting message
```
curl -X POST -H "Content-Type: application/json" -d '{
  "setting_type":"greeting",
  "greeting":{
    "text": "Olá {{user_first_name}}."
  }
}' "https://graph.facebook.com/v2.6/me/thread_settings?access_token="
```

## Setup call to actions menu
```
curl -X POST -H "Content-Type: application/json" -d '{
  "setting_type" : "call_to_actions",
  "thread_state" : "existing_thread",
  "call_to_actions":[
    {
      "type":"postback",
      "title":"Ajuda",
      "payload":"HELP_PAYLOAD"
    },
    {
      "type":"postback",
      "title":"Parar de receber notificações",
      "payload":"UNREGISTER_PAYLOAD"
    },
    {
      "type":"web_url",
      "title":"Veja a página do projeto",
      "url":"http://enchentes.infoamazonia.org/"
    }
  ]
}' "https://graph.facebook.com/v2.6/me/thread_settings?access_token="
```
