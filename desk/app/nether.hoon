/+  dbug, default-agent, server, schooner
/*  ui  %html  /app/nether/html
::
|%
+$  versioned-state  $%(state-0)
+$  state-0  [%0 docs=(map title=@t content=@t) key=@t]
+$  card  card:agent:gall
--
::
%-  agent:dbug
=|  state-0
=*  state  -
^-  agent:gall
::
=<
|_  =bowl:gall
+*  this  .
    def  ~(. (default-agent this %|) bowl)
    hc   ~(. +> [bowl ~])
::
++  on-init
  ^-  (quip card _this)
  =^  cards  state  abet:init:hc
  [cards this]
::
++  on-save
  ^-  vase
  !>(state)
::
++  on-load
  |=  =vase
  ^-  (quip card _this)
  [~ this(state !<(state-0 vase))]
::
++  on-poke
  |=  =cage
  ^-  (quip card _this)
  =^  cards  state  abet:(poke:hc cage)
  [cards this]
::
++  on-peek
  |=  =path
  ^-  (unit (unit cage))
  [~ ~]
::
++  on-agent
  |=  [=wire =sign:agent:gall]
  ^-  (quip card _this)
  `this
::
++  on-arvo
  |=  [=wire =sign-arvo]
  ^-  (quip card _this)
  `this
::
++  on-watch
  |=  =path
  ^-  (quip card _this)
  =^  cards  state  abet:(watch:hc path)
  [cards this]
::
++  on-fail   on-fail:def
++  on-leave  on-leave:def
--
::
|_  [=bowl:gall deck=(list card)]
+*  that  .
::
++  emit  |=(=card that(deck [card deck]))
++  emil  |=(lac=(list card) that(deck (welp lac deck)))
++  abet  ^-((quip card _state) [(flop deck) state])
::
++  init
  ^+  that
  =.  key  (scot %uv eny.bowl)
  %-  emit
  :*  %pass   /eyre/connect   
      %arvo  %e  %connect
      `/apps/nether  %nether
  ==
::
++  watch
  |=  =path
  ^+  that
  ?+    path  that
      [%http-response *]
    that
  ==
:: 
++  poke
  |=  =cage
  ^+  that
  ?+    -.cage  !!
      %handle-http-request
    (handle-http !<([@ta =inbound-request:eyre] +.cage))
  ==
::
++  handle-http
  |=  [eyre-id=@ta =inbound-request:eyre]
  ^+  that
  =/  ,request-line:server
    (parse-request-line:server url.request.inbound-request)
  =+  send=(cury response:schooner eyre-id)
  ::
  ?+    method.request.inbound-request
    (emil (flop (send [405 ~ [%stock ~]])))
    ::
      %'OPTIONS'
    %-  emil  %-  flop  %-  send
    [200 ~ [%allow ~]]
    ::
      %'POST'
    ?~  body.request.inbound-request  !!
    =/  headers  (malt header-list.request.inbound-request)
    =/  kee  (~(got by headers) 'authorization')
    ?>  =(key value.kee)
    =/  json  (de:json:html q.u.body.request.inbound-request)
    =/  doc
      ((ot ~[title+so content+so]):dejs:format +.json)
    =.  docs  (~(put by docs) -.doc +.doc)
    %-  emil  %-  flop  %-  send
    [200 ~ [%none ~]]
    ::
      %'GET'
    %-  emil  %-  flop  %-  send
    ?+    site  [404 ~ [%plain "404 - Not Found"]]
    ::
        [%apps %nether ~]
      ?>  =(src.bowl our.bowl)
      [200 ~ [%html ui]]
    ::
        [%apps %nether %state ~]
      ?>  =(src.bowl our.bowl)
      [200 ~ [%json enjs-state]]
    ::
        [%apps %nether %file @ ~]
      =/  headers  (malt header-list.request.inbound-request)
      =/  kee  (~(got by headers) 'authorization')
      ?>  =(key value.kee)
      =/  title  +30:site
      [200 ~ [%json (enjs-doc i.title)]]
    ==
  ==
::
++  enjs-state
  =,  enjs:format
  ^-  json
  %-  pairs
  :~  [%key [%s key]]
      ::
      :-  %docs
      :-  %a
      %+  turn
        ~(tap in ~(key by docs))
      enjs-doc
  ==
::
++  enjs-doc
  |=  title=@t
  =,  enjs:format
  ^-  json
  %-  pairs
  :~  [%title [%s title]]
      [%content [%s (~(got by docs) title)]]
  ==
--
