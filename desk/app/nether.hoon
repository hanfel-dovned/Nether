/+  dbug, default-agent, server, schooner
/*  ui  %html  /app/nether/html
::
|%
+$  versioned-state  $%(state-0)
+$  state-0
  $:  %0
      key=@t
      docs=(map vault=@t (map title=@t [content=@t timestamp=@da]))
  ==
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
      ^-  [vault=@t title=@t content=@t timestamp=@da]
      ((ot ~[vault+so title+so content+so timestamp+di]):dejs:format +.json)
    =/  old-vault  (~(get by docs) vault.doc)
    ?~  old-vault
      ::  Vault doesn't already exist, so we make it, easy
      =.  docs
        %+  ~(put by docs) 
          vault.doc 
        (malt [[title.doc [content.doc timestamp.doc]] ~])
      %-  emil  %-  flop  %-  send
      [200 ~ [%none ~]]
    =/  old-doc  (~(got by (need old-vault)) title.doc)
    ?:  (lth timestamp.doc timestamp.old-doc)
      ::  Client's latest file isn't up to date, don't let them post
      %-  emil  %-  flop  %-  send
      [409 ~ [%plain "The server has a newer version of this document."]]
    =/  new-vault
      (~(put by (need old-vault)) title.doc [content.doc timestamp.doc])
    =.  docs  (~(put by docs) vault.doc new-vault)
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
        [%apps %nether %pull ~]
      =/  headers  (malt header-list.request.inbound-request)
      =/  kee  (~(got by headers) 'authorization')
      ?>  =(key value.kee)
      =/  params  (malt args)
      =/  vault  (~(got by params) 'vault')
      =/  timestamp  (~(got by params) 'since')
      [200 ~ [%json (enjs-new [value.vault value.timestamp])]]
    ==
  ==
::
++  enjs-new
  |=  [vault=@t timestamp=@t]
  =,  enjs:format
  ^-  json
  =/  date=@da  
    (di:dejs:format n+timestamp)
  =/  v  (~(got by docs) vault)
  =/  newer
    %+  skim
      ~(tap by v)
    |=  [title=@t [content=@t stamp=@da]]
    (gth stamp date)
  %-  frond
  :-  %updates
  :-  %a
  %+  turn
    newer
  |=  [title=@t [content=@t stamp=@da]]
  %-  pairs
  :~  [%title s+title]
      [%content s+content]
      [%timestamp (time stamp)]
  ==
::
++  enjs-state
  =,  enjs:format
  ^-  json
  %-  pairs
  :~  [%key [%s key]]
      ::
      :-  %docs
      %-  pairs
      %+  turn
        ~(tap by docs)
      |=  [vault=@t files=(map title=@t [content=@t stamp=@da])]
      :-  vault
      :-  %a
      %+  turn
        ~(tap by files)
      |=  [title=@t [content=@t stamp=@da]]
      %-  pairs
      :~  [%title s+title]
          [%content s+content]
          [%timestamp (time stamp)]
      ==
  ==
--
