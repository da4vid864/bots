# Project Structure

```text
.
├── .github
│   └── agents
│       └── developer.agent.md
├── .idx
│   └── dev.nix
├── .kilocode
│   └── mcp.json
├── .vscode
│   └── settings.json
├── .wwebjs_auth
│   ├── session
│   │   ├── Crashpad
│   │   │   ├── attachments
│   │   │   ├── reports
│   │   │   ├── metadata
│   │   │   └── settings.dat
│   │   ├── Default
│   │   │   ├── blob_storage
│   │   │   │   └── 7da031be-c4fa-4d18-8e4c-e8d1b4549d28
│   │   │   ├── Cache
│   │   │   │   └── Cache_Data
│   │   │   │       ├── data_0
│   │   │   │       ├── data_1
│   │   │   │       ├── data_2
│   │   │   │       ├── data_3
│   │   │   │       ├── f_000001
│   │   │   │       ├── f_000002
│   │   │   │       ├── f_000003
│   │   │   │       ├── f_000004
│   │   │   │       ├── f_000005
│   │   │   │       ├── f_000006
│   │   │   │       ├── f_000007
│   │   │   │       ├── f_000008
│   │   │   │       ├── f_000009
│   │   │   │       ├── f_00000a
│   │   │   │       ├── f_00000b
│   │   │   │       ├── f_00000c
│   │   │   │       ├── f_00000d
│   │   │   │       ├── f_00000e
│   │   │   │       ├── f_00000f
│   │   │   │       ├── f_000010
│   │   │   │       ├── f_000011
│   │   │   │       ├── f_000012
│   │   │   │       ├── f_000013
│   │   │   │       ├── f_000014
│   │   │   │       ├── f_000015
│   │   │   │       ├── f_000016
│   │   │   │       └── index
│   │   │   ├── Code Cache
│   │   │   │   ├── js
│   │   │   │   │   ├── index-dir
│   │   │   │   │   │   └── the-real-index
│   │   │   │   │   ├── 013e17eb3d15e605_0
│   │   │   │   │   ├── 0489203a21bc07be_0
│   │   │   │   │   ├── 1291cdbf7768a01c_0
│   │   │   │   │   ├── 136d28220afdb11e_0
│   │   │   │   │   ├── 15de6e55706b017f_0
│   │   │   │   │   ├── 1c147e032b379c2a_0
│   │   │   │   │   ├── 21b08e5904b9e988_0
│   │   │   │   │   ├── 32434cddf7aa709e_0
│   │   │   │   │   ├── 3bb98399d05dca51_0
│   │   │   │   │   ├── 3e22711ab7495036_0
│   │   │   │   │   ├── 45f2da60a4414d4f_0
│   │   │   │   │   ├── 4a68cb95884d89a6_0
│   │   │   │   │   ├── 4ce2c468ffd42e49_0
│   │   │   │   │   ├── 4d0304f1005cfb12_0
│   │   │   │   │   ├── 5389ccc52c3b3288_0
│   │   │   │   │   ├── 5b0ad532651d39b0_0
│   │   │   │   │   ├── 6ee35cfe2c6cbb4b_0
│   │   │   │   │   ├── 72ae18967e1a50ee_0
│   │   │   │   │   ├── 77d7837bda41d1b2_0
│   │   │   │   │   ├── 89edb5240b486830_0
│   │   │   │   │   ├── 8a6dda4cfd1e9f06_0
│   │   │   │   │   ├── 8b19eea06202c7e5_0
│   │   │   │   │   ├── 91d2982609aa001e_0
│   │   │   │   │   ├── 9590d8f737c124f3_0
│   │   │   │   │   ├── 9e288ce907ee10d0_0
│   │   │   │   │   ├── 9f94dd6deab4fbe3_0
│   │   │   │   │   ├── a30ec68d614617f3_0
│   │   │   │   │   ├── a7199ba8e722d0a8_0
│   │   │   │   │   ├── add0f619b0420bc8_0
│   │   │   │   │   ├── afe00e7205a96e71_0
│   │   │   │   │   ├── b017bc65c67ceabe_0
│   │   │   │   │   ├── bb81d7d3a2dec9bf_0
│   │   │   │   │   ├── bf7f946c4920ea03_0
│   │   │   │   │   ├── d42596322d9c87e0_0
│   │   │   │   │   ├── df1518301aa84dca_0
│   │   │   │   │   ├── fa2b6f5135a11dd8_0
│   │   │   │   │   └── index
│   │   │   │   └── wasm
│   │   │   │       ├── index-dir
│   │   │   │       │   └── the-real-index
│   │   │   │       └── index
│   │   │   ├── databases
│   │   │   │   ├── Databases.db
│   │   │   │   └── Databases.db-journal
│   │   │   ├── DawnCache
│   │   │   │   ├── data_0
│   │   │   │   ├── data_1
│   │   │   │   ├── data_2
│   │   │   │   ├── data_3
│   │   │   │   └── index
│   │   │   ├── GPUCache
│   │   │   │   ├── data_0
│   │   │   │   ├── data_1
│   │   │   │   ├── data_2
│   │   │   │   ├── data_3
│   │   │   │   └── index
│   │   │   ├── IndexedDB
│   │   │   │   └── https_web.whatsapp.com_0.indexeddb.leveldb
│   │   │   │       ├── 000120.ldb
│   │   │   │       ├── 000121.log
│   │   │   │       ├── 000122.ldb
│   │   │   │       ├── 000123.ldb
│   │   │   │       ├── CURRENT
│   │   │   │       ├── LOCK
│   │   │   │       ├── LOG
│   │   │   │       ├── LOG.old
│   │   │   │       └── MANIFEST-000001
│   │   │   ├── Local Storage
│   │   │   │   └── leveldb
│   │   │   │       ├── 000003.log
│   │   │   │       ├── CURRENT
│   │   │   │       ├── LOCK
│   │   │   │       ├── LOG
│   │   │   │       ├── LOG.old
│   │   │   │       └── MANIFEST-000001
│   │   │   ├── Service Worker
│   │   │   │   ├── CacheStorage
│   │   │   │   │   └── 0bf6ab7f94a21cdc9c1649f884333ec20f40a544
│   │   │   │   │       ├── 7bced6a9-8f2c-4709-8a81-9c23ca415966
│   │   │   │   │       │   ├── index-dir
│   │   │   │   │       │   │   └── the-real-index
│   │   │   │   │       │   ├── 2a2b7cbbc61290b4_0
│   │   │   │   │       │   ├── 6ea66fa5b36b4157_0
│   │   │   │   │       │   ├── 92172a9e586cee2a_0
│   │   │   │   │       │   ├── e6039a61e4d2a504_0
│   │   │   │   │       │   └── index
│   │   │   │   │       ├── bb223af0-c572-40a8-9a32-9ce2f6f75fbb
│   │   │   │   │       │   ├── index-dir
│   │   │   │   │       │   │   └── the-real-index
│   │   │   │   │       │   └── index
│   │   │   │   │       └── index.txt
│   │   │   │   ├── Database
│   │   │   │   │   ├── 000003.log
│   │   │   │   │   ├── CURRENT
│   │   │   │   │   ├── LOCK
│   │   │   │   │   ├── LOG
│   │   │   │   │   ├── LOG.old
│   │   │   │   │   └── MANIFEST-000001
│   │   │   │   └── ScriptCache
│   │   │   │       ├── index-dir
│   │   │   │       │   └── the-real-index
│   │   │   │       ├── ba23d8ecda68de77_0
│   │   │   │       ├── ba23d8ecda68de77_1
│   │   │   │       ├── f1cdccba37924bda_0
│   │   │   │       ├── f1cdccba37924bda_1
│   │   │   │       └── index
│   │   │   ├── Session Storage
│   │   │   │   ├── 000003.log
│   │   │   │   ├── CURRENT
│   │   │   │   ├── LOCK
│   │   │   │   ├── LOG
│   │   │   │   ├── LOG.old
│   │   │   │   └── MANIFEST-000001
│   │   │   ├── WebStorage
│   │   │   │   ├── QuotaManager
│   │   │   │   └── QuotaManager-journal
│   │   │   ├── chrome_debug.log
│   │   │   ├── Cookies
│   │   │   └── Cookies-journal
│   │   └── DevToolsActivePort
│   ├── session-bot-1763388369442
│   │   ├── Crashpad
│   │   │   ├── attachments
│   │   │   ├── reports
│   │   │   └── settings.dat
│   │   ├── Default
│   │   │   ├── blob_storage
│   │   │   │   └── bd3c03e6-94b5-489a-9736-bc4095cf91b2
│   │   │   ├── Cache
│   │   │   │   └── Cache_Data
│   │   │   │       ├── data_0
│   │   │   │       ├── data_1
│   │   │   │       ├── data_2
│   │   │   │       ├── data_3
│   │   │   │       ├── f_000001
│   │   │   │       ├── f_000002
│   │   │   │       ├── f_000003
│   │   │   │       ├── f_000004
│   │   │   │       ├── f_000005
│   │   │   │       ├── f_000006
│   │   │   │       ├── f_000007
│   │   │   │       ├── f_000008
│   │   │   │       ├── f_000009
│   │   │   │       ├── f_00000a
│   │   │   │       ├── f_00000b
│   │   │   │       ├── f_00000c
│   │   │   │       ├── f_00000d
│   │   │   │       ├── f_00000e
│   │   │   │       ├── f_00000f
│   │   │   │       ├── f_000010
│   │   │   │       ├── f_000011
│   │   │   │       ├── f_000012
│   │   │   │       ├── f_000013
│   │   │   │       ├── f_000014
│   │   │   │       ├── f_000015
│   │   │   │       ├── f_000016
│   │   │   │       └── index
│   │   │   ├── Code Cache
│   │   │   │   ├── js
│   │   │   │   │   ├── index-dir
│   │   │   │   │   │   └── the-real-index
│   │   │   │   │   ├── 013e17eb3d15e605_0
│   │   │   │   │   ├── 0489203a21bc07be_0
│   │   │   │   │   ├── 15de6e55706b017f_0
│   │   │   │   │   ├── 21b08e5904b9e988_0
│   │   │   │   │   ├── 4ce2c468ffd42e49_0
│   │   │   │   │   ├── 72ae18967e1a50ee_0
│   │   │   │   │   ├── 77d7837bda41d1b2_0
│   │   │   │   │   ├── 8b19eea06202c7e5_0
│   │   │   │   │   ├── 9e288ce907ee10d0_0
│   │   │   │   │   ├── 9f94dd6deab4fbe3_0
│   │   │   │   │   ├── a30ec68d614617f3_0
│   │   │   │   │   ├── a7199ba8e722d0a8_0
│   │   │   │   │   ├── add0f619b0420bc8_0
│   │   │   │   │   ├── afe00e7205a96e71_0
│   │   │   │   │   ├── b017bc65c67ceabe_0
│   │   │   │   │   ├── bf7f946c4920ea03_0
│   │   │   │   │   ├── d42596322d9c87e0_0
│   │   │   │   │   ├── df1518301aa84dca_0
│   │   │   │   │   └── index
│   │   │   │   └── wasm
│   │   │   │       ├── index-dir
│   │   │   │       │   └── the-real-index
│   │   │   │       └── index
│   │   │   ├── databases
│   │   │   │   ├── Databases.db
│   │   │   │   └── Databases.db-journal
│   │   │   ├── DawnCache
│   │   │   │   ├── data_0
│   │   │   │   ├── data_1
│   │   │   │   ├── data_2
│   │   │   │   ├── data_3
│   │   │   │   └── index
│   │   │   ├── GPUCache
│   │   │   │   ├── data_0
│   │   │   │   ├── data_1
│   │   │   │   ├── data_2
│   │   │   │   ├── data_3
│   │   │   │   └── index
│   │   │   ├── IndexedDB
│   │   │   │   └── https_web.whatsapp.com_0.indexeddb.leveldb
│   │   │   │       ├── 000032.ldb
│   │   │   │       ├── 000033.log
│   │   │   │       ├── 000035.ldb
│   │   │   │       ├── CURRENT
│   │   │   │       ├── LOCK
│   │   │   │       ├── LOG
│   │   │   │       └── MANIFEST-000001
│   │   │   ├── Local Storage
│   │   │   │   └── leveldb
│   │   │   │       ├── 000003.log
│   │   │   │       ├── CURRENT
│   │   │   │       ├── LOCK
│   │   │   │       ├── LOG
│   │   │   │       └── MANIFEST-000001
│   │   │   ├── Service Worker
│   │   │   │   ├── CacheStorage
│   │   │   │   │   └── 0bf6ab7f94a21cdc9c1649f884333ec20f40a544
│   │   │   │   │       ├── 756ce41c-bf95-44e0-8f53-7140a6e6f266
│   │   │   │   │       │   ├── index-dir
│   │   │   │   │       │   │   └── the-real-index
│   │   │   │   │       │   ├── 2a2b7cbbc61290b4_0
│   │   │   │   │       │   ├── 6ea66fa5b36b4157_0
│   │   │   │   │       │   ├── 92172a9e586cee2a_0
│   │   │   │   │       │   ├── e6039a61e4d2a504_0
│   │   │   │   │       │   └── index
│   │   │   │   │       ├── c21d60d9-048a-4b91-919d-ed2322eb320f
│   │   │   │   │       │   ├── index-dir
│   │   │   │   │       │   │   └── the-real-index
│   │   │   │   │       │   └── index
│   │   │   │   │       └── index.txt
│   │   │   │   ├── Database
│   │   │   │   │   ├── 000003.log
│   │   │   │   │   ├── CURRENT
│   │   │   │   │   ├── LOCK
│   │   │   │   │   ├── LOG
│   │   │   │   │   └── MANIFEST-000001
│   │   │   │   └── ScriptCache
│   │   │   │       ├── index-dir
│   │   │   │       │   └── the-real-index
│   │   │   │       ├── 2cc80dabc69f58b6_0
│   │   │   │       ├── 2cc80dabc69f58b6_1
│   │   │   │       ├── 4cb013792b196a35_0
│   │   │   │       ├── 4cb013792b196a35_1
│   │   │   │       └── index
│   │   │   ├── Session Storage
│   │   │   │   ├── 000003.log
│   │   │   │   ├── CURRENT
│   │   │   │   ├── LOCK
│   │   │   │   ├── LOG
│   │   │   │   └── MANIFEST-000001
│   │   │   ├── WebStorage
│   │   │   │   ├── QuotaManager
│   │   │   │   └── QuotaManager-journal
│   │   │   ├── chrome_debug.log
│   │   │   ├── Cookies
│   │   │   └── Cookies-journal
│   │   └── DevToolsActivePort
│   ├── session-bot-1763388400220
│   │   ├── Crashpad
│   │   │   ├── attachments
│   │   │   ├── reports
│   │   │   └── settings.dat
│   │   ├── Default
│   │   │   ├── blob_storage
│   │   │   │   └── 29195255-c10f-4f6f-b2a5-ac38fc956564
│   │   │   ├── Cache
│   │   │   │   └── Cache_Data
│   │   │   │       ├── data_0
│   │   │   │       ├── data_1
│   │   │   │       ├── data_2
│   │   │   │       ├── data_3
│   │   │   │       ├── f_000001
│   │   │   │       ├── f_000002
│   │   │   │       ├── f_000003
│   │   │   │       ├── f_000004
│   │   │   │       ├── f_000005
│   │   │   │       ├── f_000006
│   │   │   │       ├── f_000007
│   │   │   │       ├── f_000008
│   │   │   │       ├── f_000009
│   │   │   │       ├── f_00000a
│   │   │   │       ├── f_00000b
│   │   │   │       ├── f_00000c
│   │   │   │       ├── f_00000d
│   │   │   │       ├── f_00000e
│   │   │   │       ├── f_00000f
│   │   │   │       ├── f_000010
│   │   │   │       ├── f_000011
│   │   │   │       ├── f_000012
│   │   │   │       ├── f_000013
│   │   │   │       ├── f_000014
│   │   │   │       ├── f_000015
│   │   │   │       ├── f_000016
│   │   │   │       └── index
│   │   │   ├── Code Cache
│   │   │   │   ├── js
│   │   │   │   │   ├── index-dir
│   │   │   │   │   │   └── the-real-index
│   │   │   │   │   ├── 013e17eb3d15e605_0
│   │   │   │   │   ├── 0489203a21bc07be_0
│   │   │   │   │   ├── 15de6e55706b017f_0
│   │   │   │   │   ├── 21b08e5904b9e988_0
│   │   │   │   │   ├── 4ce2c468ffd42e49_0
│   │   │   │   │   ├── 72ae18967e1a50ee_0
│   │   │   │   │   ├── 77d7837bda41d1b2_0
│   │   │   │   │   ├── 8b19eea06202c7e5_0
│   │   │   │   │   ├── 9e288ce907ee10d0_0
│   │   │   │   │   ├── 9f94dd6deab4fbe3_0
│   │   │   │   │   ├── a30ec68d614617f3_0
│   │   │   │   │   ├── a7199ba8e722d0a8_0
│   │   │   │   │   ├── add0f619b0420bc8_0
│   │   │   │   │   ├── afe00e7205a96e71_0
│   │   │   │   │   ├── b017bc65c67ceabe_0
│   │   │   │   │   ├── bf7f946c4920ea03_0
│   │   │   │   │   ├── d42596322d9c87e0_0
│   │   │   │   │   ├── df1518301aa84dca_0
│   │   │   │   │   └── index
│   │   │   │   └── wasm
│   │   │   │       ├── index-dir
│   │   │   │       │   └── the-real-index
│   │   │   │       └── index
│   │   │   ├── databases
│   │   │   │   ├── Databases.db
│   │   │   │   └── Databases.db-journal
│   │   │   ├── DawnCache
│   │   │   │   ├── data_0
│   │   │   │   ├── data_1
│   │   │   │   ├── data_2
│   │   │   │   ├── data_3
│   │   │   │   └── index
│   │   │   ├── GPUCache
│   │   │   │   ├── data_0
│   │   │   │   ├── data_1
│   │   │   │   ├── data_2
│   │   │   │   ├── data_3
│   │   │   │   └── index
│   │   │   ├── IndexedDB
│   │   │   │   └── https_web.whatsapp.com_0.indexeddb.leveldb
│   │   │   │       ├── 000032.ldb
│   │   │   │       ├── 000033.log
│   │   │   │       ├── 000035.ldb
│   │   │   │       ├── CURRENT
│   │   │   │       ├── LOCK
│   │   │   │       ├── LOG
│   │   │   │       └── MANIFEST-000001
│   │   │   ├── Local Storage
│   │   │   │   └── leveldb
│   │   │   │       ├── 000003.log
│   │   │   │       ├── CURRENT
│   │   │   │       ├── LOCK
│   │   │   │       ├── LOG
│   │   │   │       └── MANIFEST-000001
│   │   │   ├── Service Worker
│   │   │   │   ├── CacheStorage
│   │   │   │   │   └── 0bf6ab7f94a21cdc9c1649f884333ec20f40a544
│   │   │   │   │       ├── 19337e5b-be27-49a0-8289-23842742ac36
│   │   │   │   │       │   ├── index-dir
│   │   │   │   │       │   │   └── the-real-index
│   │   │   │   │       │   └── index
│   │   │   │   │       ├── a8fc3719-a4b1-4d44-9881-c63758dc26ca
│   │   │   │   │       │   ├── index-dir
│   │   │   │   │       │   │   └── the-real-index
│   │   │   │   │       │   ├── 2a2b7cbbc61290b4_0
│   │   │   │   │       │   ├── 6ea66fa5b36b4157_0
│   │   │   │   │       │   ├── 92172a9e586cee2a_0
│   │   │   │   │       │   ├── e6039a61e4d2a504_0
│   │   │   │   │       │   └── index
│   │   │   │   │       └── index.txt
│   │   │   │   ├── Database
│   │   │   │   │   ├── 000003.log
│   │   │   │   │   ├── CURRENT
│   │   │   │   │   ├── LOCK
│   │   │   │   │   ├── LOG
│   │   │   │   │   └── MANIFEST-000001
│   │   │   │   └── ScriptCache
│   │   │   │       ├── index-dir
│   │   │   │       │   └── the-real-index
│   │   │   │       ├── 2cc80dabc69f58b6_0
│   │   │   │       ├── 2cc80dabc69f58b6_1
│   │   │   │       ├── 4cb013792b196a35_0
│   │   │   │       ├── 4cb013792b196a35_1
│   │   │   │       └── index
│   │   │   ├── Session Storage
│   │   │   │   ├── 000003.log
│   │   │   │   ├── CURRENT
│   │   │   │   ├── LOCK
│   │   │   │   ├── LOG
│   │   │   │   └── MANIFEST-000001
│   │   │   ├── WebStorage
│   │   │   │   ├── QuotaManager
│   │   │   │   └── QuotaManager-journal
│   │   │   ├── chrome_debug.log
│   │   │   ├── Cookies
│   │   │   └── Cookies-journal
│   │   └── DevToolsActivePort
│   ├── session-bot-1763388401680
│   │   ├── Crashpad
│   │   │   ├── attachments
│   │   │   ├── reports
│   │   │   └── settings.dat
│   │   ├── Default
│   │   │   ├── blob_storage
│   │   │   │   └── 9d720b13-8f77-405b-a987-f3f94b6d3662
│   │   │   ├── Cache
│   │   │   │   └── Cache_Data
│   │   │   │       ├── data_0
│   │   │   │       ├── data_1
│   │   │   │       ├── data_2
│   │   │   │       ├── data_3
│   │   │   │       ├── f_000001
│   │   │   │       ├── f_000002
│   │   │   │       ├── f_000003
│   │   │   │       ├── f_000004
│   │   │   │       ├── f_000005
│   │   │   │       ├── f_000006
│   │   │   │       ├── f_000007
│   │   │   │       ├── f_000008
│   │   │   │       ├── f_000009
│   │   │   │       ├── f_00000a
│   │   │   │       ├── f_00000b
│   │   │   │       ├── f_00000c
│   │   │   │       ├── f_00000d
│   │   │   │       ├── f_00000e
│   │   │   │       ├── f_00000f
│   │   │   │       ├── f_000010
│   │   │   │       ├── f_000011
│   │   │   │       ├── f_000012
│   │   │   │       ├── f_000013
│   │   │   │       ├── f_000014
│   │   │   │       ├── f_000015
│   │   │   │       ├── f_000016
│   │   │   │       └── index
│   │   │   ├── Code Cache
│   │   │   │   ├── js
│   │   │   │   │   ├── index-dir
│   │   │   │   │   │   └── the-real-index
│   │   │   │   │   ├── 013e17eb3d15e605_0
│   │   │   │   │   ├── 0489203a21bc07be_0
│   │   │   │   │   ├── 15de6e55706b017f_0
│   │   │   │   │   ├── 21b08e5904b9e988_0
│   │   │   │   │   ├── 4ce2c468ffd42e49_0
│   │   │   │   │   ├── 72ae18967e1a50ee_0
│   │   │   │   │   ├── 77d7837bda41d1b2_0
│   │   │   │   │   ├── 8b19eea06202c7e5_0
│   │   │   │   │   ├── 9e288ce907ee10d0_0
│   │   │   │   │   ├── 9f94dd6deab4fbe3_0
│   │   │   │   │   ├── a30ec68d614617f3_0
│   │   │   │   │   ├── a7199ba8e722d0a8_0
│   │   │   │   │   ├── add0f619b0420bc8_0
│   │   │   │   │   ├── afe00e7205a96e71_0
│   │   │   │   │   ├── b017bc65c67ceabe_0
│   │   │   │   │   ├── bf7f946c4920ea03_0
│   │   │   │   │   ├── d42596322d9c87e0_0
│   │   │   │   │   ├── df1518301aa84dca_0
│   │   │   │   │   └── index
│   │   │   │   └── wasm
│   │   │   │       ├── index-dir
│   │   │   │       │   └── the-real-index
│   │   │   │       └── index
│   │   │   ├── databases
│   │   │   │   ├── Databases.db
│   │   │   │   └── Databases.db-journal
│   │   │   ├── DawnCache
│   │   │   │   ├── data_0
│   │   │   │   ├── data_1
│   │   │   │   ├── data_2
│   │   │   │   ├── data_3
│   │   │   │   └── index
│   │   │   ├── GPUCache
│   │   │   │   ├── data_0
│   │   │   │   ├── data_1
│   │   │   │   ├── data_2
│   │   │   │   ├── data_3
│   │   │   │   └── index
│   │   │   ├── IndexedDB
│   │   │   │   └── https_web.whatsapp.com_0.indexeddb.leveldb
│   │   │   │       ├── 000035.ldb
│   │   │   │       ├── 000036.log
│   │   │   │       ├── 000038.ldb
│   │   │   │       ├── CURRENT
│   │   │   │       ├── LOCK
│   │   │   │       ├── LOG
│   │   │   │       └── MANIFEST-000001
│   │   │   ├── Local Storage
│   │   │   │   └── leveldb
│   │   │   │       ├── 000003.log
│   │   │   │       ├── CURRENT
│   │   │   │       ├── LOCK
│   │   │   │       ├── LOG
│   │   │   │       └── MANIFEST-000001
│   │   │   ├── Service Worker
│   │   │   │   ├── CacheStorage
│   │   │   │   │   └── 0bf6ab7f94a21cdc9c1649f884333ec20f40a544
│   │   │   │   │       ├── 199ac928-f3ea-4e7d-a330-7c963002bbc3
│   │   │   │   │       │   ├── index-dir
│   │   │   │   │       │   │   └── the-real-index
│   │   │   │   │       │   └── index
│   │   │   │   │       ├── 87db0d8c-0885-43f3-b08b-9f6aecd6d113
│   │   │   │   │       │   ├── index-dir
│   │   │   │   │       │   │   └── the-real-index
│   │   │   │   │       │   ├── 2a2b7cbbc61290b4_0
│   │   │   │   │       │   ├── 6ea66fa5b36b4157_0
│   │   │   │   │       │   ├── 92172a9e586cee2a_0
│   │   │   │   │       │   ├── e6039a61e4d2a504_0
│   │   │   │   │       │   └── index
│   │   │   │   │       └── index.txt
│   │   │   │   ├── Database
│   │   │   │   │   ├── 000003.log
│   │   │   │   │   ├── CURRENT
│   │   │   │   │   ├── LOCK
│   │   │   │   │   ├── LOG
│   │   │   │   │   └── MANIFEST-000001
│   │   │   │   └── ScriptCache
│   │   │   │       ├── index-dir
│   │   │   │       │   └── the-real-index
│   │   │   │       ├── 2cc80dabc69f58b6_0
│   │   │   │       ├── 2cc80dabc69f58b6_1
│   │   │   │       ├── 4cb013792b196a35_0
│   │   │   │       ├── 4cb013792b196a35_1
│   │   │   │       └── index
│   │   │   ├── Session Storage
│   │   │   │   ├── 000003.log
│   │   │   │   ├── CURRENT
│   │   │   │   ├── LOCK
│   │   │   │   ├── LOG
│   │   │   │   └── MANIFEST-000001
│   │   │   ├── WebStorage
│   │   │   │   ├── QuotaManager
│   │   │   │   └── QuotaManager-journal
│   │   │   ├── chrome_debug.log
│   │   │   ├── Cookies
│   │   │   └── Cookies-journal
│   │   └── DevToolsActivePort
│   ├── session-bot-1763388576628
│   │   ├── Crashpad
│   │   │   ├── attachments
│   │   │   ├── reports
│   │   │   └── settings.dat
│   │   ├── Default
│   │   │   ├── blob_storage
│   │   │   │   └── ed68c94d-a0fa-4f63-9644-75bc9fb9b495
│   │   │   ├── Cache
│   │   │   │   └── Cache_Data
│   │   │   │       ├── data_0
│   │   │   │       ├── data_1
│   │   │   │       ├── data_2
│   │   │   │       ├── data_3
│   │   │   │       ├── f_000001
│   │   │   │       ├── f_000002
│   │   │   │       ├── f_000003
│   │   │   │       ├── f_000004
│   │   │   │       ├── f_000005
│   │   │   │       ├── f_000006
│   │   │   │       ├── f_000007
│   │   │   │       ├── f_000008
│   │   │   │       ├── f_000009
│   │   │   │       ├── f_00000a
│   │   │   │       ├── f_00000b
│   │   │   │       ├── f_00000c
│   │   │   │       ├── f_00000d
│   │   │   │       ├── f_00000e
│   │   │   │       ├── f_00000f
│   │   │   │       ├── f_000010
│   │   │   │       ├── f_000011
│   │   │   │       ├── f_000012
│   │   │   │       ├── f_000013
│   │   │   │       ├── f_000014
│   │   │   │       ├── f_000015
│   │   │   │       ├── f_000016
│   │   │   │       └── index
│   │   │   ├── Code Cache
│   │   │   │   ├── js
│   │   │   │   │   ├── index-dir
│   │   │   │   │   │   └── the-real-index
│   │   │   │   │   ├── 013e17eb3d15e605_0
│   │   │   │   │   ├── 0489203a21bc07be_0
│   │   │   │   │   ├── 15de6e55706b017f_0
│   │   │   │   │   ├── 21b08e5904b9e988_0
│   │   │   │   │   ├── 4ce2c468ffd42e49_0
│   │   │   │   │   ├── 72ae18967e1a50ee_0
│   │   │   │   │   ├── 77d7837bda41d1b2_0
│   │   │   │   │   ├── 8b19eea06202c7e5_0
│   │   │   │   │   ├── 9e288ce907ee10d0_0
│   │   │   │   │   ├── 9f94dd6deab4fbe3_0
│   │   │   │   │   ├── a30ec68d614617f3_0
│   │   │   │   │   ├── a7199ba8e722d0a8_0
│   │   │   │   │   ├── add0f619b0420bc8_0
│   │   │   │   │   ├── afe00e7205a96e71_0
│   │   │   │   │   ├── b017bc65c67ceabe_0
│   │   │   │   │   ├── bf7f946c4920ea03_0
│   │   │   │   │   ├── d42596322d9c87e0_0
│   │   │   │   │   ├── df1518301aa84dca_0
│   │   │   │   │   └── index
│   │   │   │   └── wasm
│   │   │   │       ├── index-dir
│   │   │   │       │   └── the-real-index
│   │   │   │       └── index
│   │   │   ├── databases
│   │   │   │   ├── Databases.db
│   │   │   │   └── Databases.db-journal
│   │   │   ├── DawnCache
│   │   │   │   ├── data_0
│   │   │   │   ├── data_1
│   │   │   │   ├── data_2
│   │   │   │   ├── data_3
│   │   │   │   └── index
│   │   │   ├── GPUCache
│   │   │   │   ├── data_0
│   │   │   │   ├── data_1
│   │   │   │   ├── data_2
│   │   │   │   ├── data_3
│   │   │   │   └── index
│   │   │   ├── IndexedDB
│   │   │   │   └── https_web.whatsapp.com_0.indexeddb.leveldb
│   │   │   │       ├── 000035.ldb
│   │   │   │       ├── 000036.log
│   │   │   │       ├── 000038.ldb
│   │   │   │       ├── CURRENT
│   │   │   │       ├── LOCK
│   │   │   │       ├── LOG
│   │   │   │       └── MANIFEST-000001
│   │   │   ├── Local Storage
│   │   │   │   └── leveldb
│   │   │   │       ├── 000003.log
│   │   │   │       ├── CURRENT
│   │   │   │       ├── LOCK
│   │   │   │       ├── LOG
│   │   │   │       └── MANIFEST-000001
│   │   │   ├── Service Worker
│   │   │   │   ├── CacheStorage
│   │   │   │   │   └── 0bf6ab7f94a21cdc9c1649f884333ec20f40a544
│   │   │   │   │       ├── b001d1d2-5398-468b-8186-f870ad4cc846
│   │   │   │   │       │   ├── index-dir
│   │   │   │   │       │   │   └── the-real-index
│   │   │   │   │       │   ├── 2a2b7cbbc61290b4_0
│   │   │   │   │       │   ├── 6ea66fa5b36b4157_0
│   │   │   │   │       │   ├── 92172a9e586cee2a_0
│   │   │   │   │       │   ├── e6039a61e4d2a504_0
│   │   │   │   │       │   └── index
│   │   │   │   │       ├── c00d7256-3626-4e26-bbb4-a9886c54e97e
│   │   │   │   │       │   ├── index-dir
│   │   │   │   │       │   │   └── the-real-index
│   │   │   │   │       │   └── index
│   │   │   │   │       └── index.txt
│   │   │   │   ├── Database
│   │   │   │   │   ├── 000003.log
│   │   │   │   │   ├── CURRENT
│   │   │   │   │   ├── LOCK
│   │   │   │   │   ├── LOG
│   │   │   │   │   └── MANIFEST-000001
│   │   │   │   └── ScriptCache
│   │   │   │       ├── index-dir
│   │   │   │       │   └── the-real-index
│   │   │   │       ├── 2cc80dabc69f58b6_0
│   │   │   │       ├── 2cc80dabc69f58b6_1
│   │   │   │       ├── 4cb013792b196a35_0
│   │   │   │       ├── 4cb013792b196a35_1
│   │   │   │       └── index
│   │   │   ├── Session Storage
│   │   │   │   ├── 000003.log
│   │   │   │   ├── CURRENT
│   │   │   │   ├── LOCK
│   │   │   │   ├── LOG
│   │   │   │   └── MANIFEST-000001
│   │   │   ├── WebStorage
│   │   │   │   ├── QuotaManager
│   │   │   │   └── QuotaManager-journal
│   │   │   ├── chrome_debug.log
│   │   │   ├── Cookies
│   │   │   └── Cookies-journal
│   │   └── DevToolsActivePort
│   ├── session-botito
│   │   ├── Crashpad
│   │   │   ├── attachments
│   │   │   ├── reports
│   │   │   └── settings.dat
│   │   ├── Default
│   │   │   ├── blob_storage
│   │   │   │   └── 1f582f8a-a653-4598-8d88-159683fc44bd
│   │   │   ├── Cache
│   │   │   │   └── Cache_Data
│   │   │   │       ├── data_0
│   │   │   │       ├── data_1
│   │   │   │       ├── data_2
│   │   │   │       ├── data_3
│   │   │   │       ├── f_000001
│   │   │   │       ├── f_000002
│   │   │   │       ├── f_000003
│   │   │   │       ├── f_000004
│   │   │   │       ├── f_000005
│   │   │   │       ├── f_000006
│   │   │   │       ├── f_000007
│   │   │   │       ├── f_000008
│   │   │   │       ├── f_000009
│   │   │   │       ├── f_00000a
│   │   │   │       ├── f_00000b
│   │   │   │       ├── f_00000c
│   │   │   │       ├── f_00000d
│   │   │   │       ├── f_00000e
│   │   │   │       ├── f_00000f
│   │   │   │       ├── f_000010
│   │   │   │       ├── f_000011
│   │   │   │       ├── f_000012
│   │   │   │       ├── f_000013
│   │   │   │       ├── f_000014
│   │   │   │       ├── f_000015
│   │   │   │       ├── f_000016
│   │   │   │       ├── f_000017
│   │   │   │       ├── f_000018
│   │   │   │       ├── f_000019
│   │   │   │       ├── f_00001a
│   │   │   │       ├── f_00001b
│   │   │   │       ├── f_00001c
│   │   │   │       ├── f_00001d
│   │   │   │       ├── f_00001e
│   │   │   │       ├── f_00001f
│   │   │   │       ├── f_000020
│   │   │   │       ├── f_000021
│   │   │   │       ├── f_000022
│   │   │   │       ├── f_000023
│   │   │   │       ├── f_000024
│   │   │   │       ├── f_000025
│   │   │   │       ├── f_000026
│   │   │   │       ├── f_000027
│   │   │   │       ├── f_000028
│   │   │   │       ├── f_000029
│   │   │   │       ├── f_00002a
│   │   │   │       └── index
│   │   │   ├── Code Cache
│   │   │   │   ├── js
│   │   │   │   │   ├── index-dir
│   │   │   │   │   │   └── the-real-index
│   │   │   │   │   ├── 0008fcee61615d40_0
│   │   │   │   │   ├── 0142cbfece5145e1_0
│   │   │   │   │   ├── 0489203a21bc07be_0
│   │   │   │   │   ├── 06ce553881fcdcc8_0
│   │   │   │   │   ├── 0b920f280f274554_0
│   │   │   │   │   ├── 15de6e55706b017f_0
│   │   │   │   │   ├── 18182f6f6d20e1de_0
│   │   │   │   │   ├── 1d1dc42b80015f45_0
│   │   │   │   │   ├── 21b08e5904b9e988_0
│   │   │   │   │   ├── 21d1dfe01b2b4398_0
│   │   │   │   │   ├── 22f9c4d565e6414e_0
│   │   │   │   │   ├── 269012c8e244e94b_0
│   │   │   │   │   ├── 27a2ffb056e4aa12_0
│   │   │   │   │   ├── 2e10a135afe4cbe5_0
│   │   │   │   │   ├── 33a60d73f61a5922_0
│   │   │   │   │   ├── 3dd98780ab85caf9_0
│   │   │   │   │   ├── 43fb81b71f6f1201_0
│   │   │   │   │   ├── 452321f4278390f3_0
│   │   │   │   │   ├── 458b70991d8b1ee5_0
│   │   │   │   │   ├── 4bdb40085457f606_0
│   │   │   │   │   ├── 4ce2c468ffd42e49_0
│   │   │   │   │   ├── 55b1fc243666b94e_0
│   │   │   │   │   ├── 5e1bf4c73785b8bf_0
│   │   │   │   │   ├── 627cd4abe2ce7ef6_0
│   │   │   │   │   ├── 6676e01309c4bf68_0
│   │   │   │   │   ├── 669c0ea690e1f250_0
│   │   │   │   │   ├── 66d05c164885c1cf_0
│   │   │   │   │   ├── 7272d94cc2dcd912_0
│   │   │   │   │   ├── 77d0a539a95e2aac_0
│   │   │   │   │   ├── 80396b6f469d9d08_0
│   │   │   │   │   ├── 81774656e3b16945_0
│   │   │   │   │   ├── 841be14ef0be7f23_0
│   │   │   │   │   ├── 8430db7d16facaa7_0
│   │   │   │   │   ├── 85ab3f0acaabf9c3_0
│   │   │   │   │   ├── 85d65687fc0797f2_0
│   │   │   │   │   ├── 88b33ef9b8cb9596_0
│   │   │   │   │   ├── 8cc733463d36b09a_0
│   │   │   │   │   ├── 8d1f7800a002dbd0_0
│   │   │   │   │   ├── 9042856872cd46c3_0
│   │   │   │   │   ├── 9857cd9cc8bf8a17_0
│   │   │   │   │   ├── 9a17387ed23db3d9_0
│   │   │   │   │   ├── 9e288ce907ee10d0_0
│   │   │   │   │   ├── a11ca9adb841ab94_0
│   │   │   │   │   ├── a151b49ea1af8f9d_0
│   │   │   │   │   ├── a2aa65c1ead00fa7_0
│   │   │   │   │   ├── a30ec68d614617f3_0
│   │   │   │   │   ├── a3cf67d2cd55581f_0
│   │   │   │   │   ├── a7199ba8e722d0a8_0
│   │   │   │   │   ├── a8cc2d3b8d646c46_0
│   │   │   │   │   ├── add0f619b0420bc8_0
│   │   │   │   │   ├── af552b5a1862cec3_0
│   │   │   │   │   ├── afe00e7205a96e71_0
│   │   │   │   │   ├── b017bc65c67ceabe_0
│   │   │   │   │   ├── b02554c373a9e3b7_0
│   │   │   │   │   ├── b3b15afcf3be254b_0
│   │   │   │   │   ├── b8349b07c8fd293f_0
│   │   │   │   │   ├── b90b77a0990804fd_0
│   │   │   │   │   ├── c0268c97b7d6ad1a_0
│   │   │   │   │   ├── d1b68dd1612c7712_0
│   │   │   │   │   ├── d42596322d9c87e0_0
│   │   │   │   │   ├── d603967ffcc26cb3_0
│   │   │   │   │   ├── d7e6d21a65918b91_0
│   │   │   │   │   ├── edf5d70969526042_0
│   │   │   │   │   ├── f2281df88d29c4aa_0
│   │   │   │   │   ├── f2f87e5d26a01e8d_0
│   │   │   │   │   ├── f7b8e44709a3d266_0
│   │   │   │   │   ├── fabff261b916531a_0
│   │   │   │   │   ├── fdf6b4dd544c97d0_0
│   │   │   │   │   └── index
│   │   │   │   └── wasm
│   │   │   │       ├── index-dir
│   │   │   │       │   └── the-real-index
│   │   │   │       └── index
│   │   │   ├── databases
│   │   │   │   ├── Databases.db
│   │   │   │   └── Databases.db-journal
│   │   │   ├── DawnCache
│   │   │   │   ├── data_0
│   │   │   │   ├── data_1
│   │   │   │   ├── data_2
│   │   │   │   ├── data_3
│   │   │   │   └── index
│   │   │   ├── GPUCache
│   │   │   │   ├── data_0
│   │   │   │   ├── data_1
│   │   │   │   ├── data_2
│   │   │   │   ├── data_3
│   │   │   │   └── index
│   │   │   ├── IndexedDB
│   │   │   │   └── https_web.whatsapp.com_0.indexeddb.leveldb
│   │   │   │       ├── 000730.ldb
│   │   │   │       ├── 000759.ldb
│   │   │   │       ├── 000760.log
│   │   │   │       ├── 000762.ldb
│   │   │   │       ├── CURRENT
│   │   │   │       ├── LOCK
│   │   │   │       ├── LOG
│   │   │   │       ├── LOG.old
│   │   │   │       └── MANIFEST-000001
│   │   │   ├── Local Storage
│   │   │   │   └── leveldb
│   │   │   │       ├── 000003.log
│   │   │   │       ├── CURRENT
│   │   │   │       ├── LOCK
│   │   │   │       ├── LOG
│   │   │   │       ├── LOG.old
│   │   │   │       └── MANIFEST-000001
│   │   │   ├── Service Worker
│   │   │   │   ├── CacheStorage
│   │   │   │   │   └── 0bf6ab7f94a21cdc9c1649f884333ec20f40a544
│   │   │   │   │       ├── 5357683a-a486-4400-b0a0-817ba44a8240
│   │   │   │   │       │   ├── index-dir
│   │   │   │   │       │   │   └── the-real-index
│   │   │   │   │       │   ├── 2a2b7cbbc61290b4_0
│   │   │   │   │       │   ├── 6ea66fa5b36b4157_0
│   │   │   │   │       │   ├── 92172a9e586cee2a_0
│   │   │   │   │       │   ├── e6039a61e4d2a504_0
│   │   │   │   │       │   └── index
│   │   │   │   │       ├── d91e93d6-e10b-4efa-b1db-c5b3268a4476
│   │   │   │   │       │   ├── index-dir
│   │   │   │   │       │   │   └── the-real-index
│   │   │   │   │       │   └── index
│   │   │   │   │       └── index.txt
│   │   │   │   ├── Database
│   │   │   │   │   ├── 000003.log
│   │   │   │   │   ├── CURRENT
│   │   │   │   │   ├── LOCK
│   │   │   │   │   ├── LOG
│   │   │   │   │   ├── LOG.old
│   │   │   │   │   └── MANIFEST-000001
│   │   │   │   └── ScriptCache
│   │   │   │       ├── index-dir
│   │   │   │       │   └── the-real-index
│   │   │   │       ├── 08b99d499107ba17_0
│   │   │   │       ├── 08b99d499107ba17_1
│   │   │   │       ├── 7b4fd8111178d5b1_0
│   │   │   │       ├── 7b4fd8111178d5b1_1
│   │   │   │       └── index
│   │   │   ├── Session Storage
│   │   │   │   ├── 000003.log
│   │   │   │   ├── CURRENT
│   │   │   │   ├── LOCK
│   │   │   │   ├── LOG
│   │   │   │   ├── LOG.old
│   │   │   │   └── MANIFEST-000001
│   │   │   ├── WebStorage
│   │   │   │   ├── QuotaManager
│   │   │   │   └── QuotaManager-journal
│   │   │   ├── chrome_debug.log
│   │   │   ├── Cookies
│   │   │   └── Cookies-journal
│   │   └── DevToolsActivePort
│   ├── session-soldabot
│   │   └── Default
│   │       ├── Cache
│   │       │   └── Cache_Data
│   │       │       ├── data_0
│   │       │       ├── data_1
│   │       │       ├── data_2
│   │       │       ├── data_3
│   │       │       └── index
│   │       ├── databases
│   │       │   └── Databases.db
│   │       ├── DawnCache
│   │       │   ├── data_0
│   │       │   ├── data_1
│   │       │   ├── data_2
│   │       │   ├── data_3
│   │       │   └── index
│   │       ├── GPUCache
│   │       │   ├── data_0
│   │       │   ├── data_1
│   │       │   ├── data_2
│   │       │   ├── data_3
│   │       │   └── index
│   │       ├── IndexedDB
│   │       │   └── https_web.whatsapp.com_0.indexeddb.leveldb
│   │       │       ├── 000104.ldb
│   │       │       ├── 000105.ldb
│   │       │       ├── 000106.ldb
│   │       │       ├── 000107.ldb
│   │       │       ├── 000108.log
│   │       │       ├── 000109.ldb
│   │       │       ├── 000110.ldb
│   │       │       ├── 000111.ldb
│   │       │       ├── 000112.ldb
│   │       │       ├── 000113.ldb
│   │       │       ├── LOCK
│   │       │       ├── LOG
│   │       │       └── MANIFEST-000001
│   │       ├── Local Storage
│   │       │   └── leveldb
│   │       │       ├── 000003.log
│   │       │       ├── LOCK
│   │       │       ├── LOG
│   │       │       └── MANIFEST-000001
│   │       ├── Service Worker
│   │       │   └── Database
│   │       │       ├── 000003.log
│   │       │       ├── LOCK
│   │       │       ├── LOG
│   │       │       └── MANIFEST-000001
│   │       ├── Session Storage
│   │       │   ├── 000003.log
│   │       │   ├── LOCK
│   │       │   ├── LOG
│   │       │   └── MANIFEST-000001
│   │       ├── WebStorage
│   │       │   ├── QuotaManager
│   │       │   └── QuotaManager-journal
│   │       ├── chrome_debug.log
│   │       ├── Cookies
│   │       └── Cookies-journal
│   ├── session-ventas-mx
│   │   ├── Crashpad
│   │   │   ├── attachments
│   │   │   ├── reports
│   │   │   ├── metadata
│   │   │   └── settings.dat
│   │   ├── Default
│   │   │   ├── blob_storage
│   │   │   │   └── d4191ced-9794-4860-aafc-18a8cd8a4473
│   │   │   ├── Cache
│   │   │   │   └── Cache_Data
│   │   │   │       ├── data_0
│   │   │   │       ├── data_1
│   │   │   │       ├── data_2
│   │   │   │       ├── data_3
│   │   │   │       ├── f_00018e
│   │   │   │       ├── f_00018f
│   │   │   │       ├── f_000190
│   │   │   │       ├── f_000191
│   │   │   │       ├── f_000192
│   │   │   │       ├── f_000193
│   │   │   │       ├── f_000194
│   │   │   │       ├── f_000195
│   │   │   │       ├── f_000196
│   │   │   │       ├── f_000197
│   │   │   │       ├── f_000199
│   │   │   │       ├── f_00019a
│   │   │   │       ├── f_00019b
│   │   │   │       ├── f_00019e
│   │   │   │       ├── f_00019f
│   │   │   │       ├── f_0001a0
│   │   │   │       ├── f_0001a1
│   │   │   │       ├── f_0001a2
│   │   │   │       ├── f_0001a3
│   │   │   │       ├── f_0001a4
│   │   │   │       ├── f_0001a5
│   │   │   │       ├── f_0001a6
│   │   │   │       ├── f_0001a7
│   │   │   │       ├── f_0001a8
│   │   │   │       ├── f_0001a9
│   │   │   │       ├── f_0001aa
│   │   │   │       ├── f_0001ac
│   │   │   │       ├── f_0001ad
│   │   │   │       ├── f_0001ae
│   │   │   │       ├── f_0001b2
│   │   │   │       ├── f_0001b3
│   │   │   │       ├── f_0001b4
│   │   │   │       ├── f_0001b5
│   │   │   │       ├── f_0001b6
│   │   │   │       ├── f_0001b7
│   │   │   │       ├── f_0001b8
│   │   │   │       ├── f_0001b9
│   │   │   │       ├── f_0001ba
│   │   │   │       ├── f_0001bb
│   │   │   │       ├── f_0001bc
│   │   │   │       ├── f_0001bd
│   │   │   │       ├── f_0001be
│   │   │   │       ├── f_0001bf
│   │   │   │       ├── f_0001c0
│   │   │   │       ├── f_0001c1
│   │   │   │       ├── f_0001c2
│   │   │   │       ├── f_0001c3
│   │   │   │       ├── f_0001c4
│   │   │   │       ├── f_0001c5
│   │   │   │       ├── f_0001c6
│   │   │   │       ├── f_0001c7
│   │   │   │       ├── f_0001c8
│   │   │   │       ├── f_0001c9
│   │   │   │       ├── f_0001ca
│   │   │   │       ├── f_0001cb
│   │   │   │       ├── f_0001cc
│   │   │   │       ├── f_0001cd
│   │   │   │       ├── f_0001ce
│   │   │   │       ├── f_0001cf
│   │   │   │       ├── f_0001d0
│   │   │   │       ├── f_0001d1
│   │   │   │       ├── f_0001d2
│   │   │   │       ├── f_0001d3
│   │   │   │       ├── f_0001d4
│   │   │   │       ├── f_0001d5
│   │   │   │       ├── f_0001d6
│   │   │   │       ├── f_0001d7
│   │   │   │       ├── f_0001d8
│   │   │   │       ├── f_0001d9
│   │   │   │       ├── f_0001da
│   │   │   │       ├── f_0001db
│   │   │   │       ├── f_0001dc
│   │   │   │       ├── f_0001dd
│   │   │   │       ├── f_0001de
│   │   │   │       ├── f_0001df
│   │   │   │       ├── f_0001e0
│   │   │   │       ├── f_0001e1
│   │   │   │       ├── f_0001e2
│   │   │   │       ├── f_0001e3
│   │   │   │       ├── f_0001e4
│   │   │   │       ├── f_0001e5
│   │   │   │       ├── f_0001e6
│   │   │   │       ├── f_0001e7
│   │   │   │       ├── f_0001e8
│   │   │   │       ├── f_0001e9
│   │   │   │       ├── f_0001ea
│   │   │   │       ├── f_0001eb
│   │   │   │       ├── f_0001ec
│   │   │   │       ├── f_0001ed
│   │   │   │       ├── f_0001ee
│   │   │   │       ├── f_0001ef
│   │   │   │       ├── f_0001f0
│   │   │   │       ├── f_0001f1
│   │   │   │       ├── f_0001f2
│   │   │   │       ├── f_0001f3
│   │   │   │       ├── f_0001f4
│   │   │   │       ├── f_0001f5
│   │   │   │       ├── f_0001f6
│   │   │   │       ├── f_0001f7
│   │   │   │       ├── f_0001f8
│   │   │   │       ├── f_0001f9
│   │   │   │       ├── f_0001fa
│   │   │   │       ├── f_0001fb
│   │   │   │       ├── f_0001fc
│   │   │   │       ├── f_0001fd
│   │   │   │       ├── f_0001fe
│   │   │   │       ├── f_0001ff
│   │   │   │       ├── f_000200
│   │   │   │       ├── f_000201
│   │   │   │       ├── f_000202
│   │   │   │       ├── f_000203
│   │   │   │       ├── f_000204
│   │   │   │       ├── f_000205
│   │   │   │       ├── f_000206
│   │   │   │       ├── f_000207
│   │   │   │       ├── f_000208
│   │   │   │       ├── f_000209
│   │   │   │       ├── f_00020a
│   │   │   │       ├── f_00020b
│   │   │   │       ├── f_00020c
│   │   │   │       ├── f_00020d
│   │   │   │       ├── f_00020e
│   │   │   │       ├── f_00020f
│   │   │   │       ├── f_000210
│   │   │   │       ├── f_000211
│   │   │   │       ├── f_000212
│   │   │   │       ├── f_000213
│   │   │   │       ├── f_000214
│   │   │   │       ├── f_000215
│   │   │   │       ├── f_000216
│   │   │   │       ├── f_000217
│   │   │   │       ├── f_000218
│   │   │   │       ├── f_000219
│   │   │   │       ├── f_00021a
│   │   │   │       ├── f_00021b
│   │   │   │       ├── f_00021c
│   │   │   │       ├── f_00021d
│   │   │   │       ├── f_00021e
│   │   │   │       ├── f_00021f
│   │   │   │       ├── f_000220
│   │   │   │       ├── f_000221
│   │   │   │       ├── f_000222
│   │   │   │       ├── f_000223
│   │   │   │       ├── f_000224
│   │   │   │       ├── f_000225
│   │   │   │       ├── f_000226
│   │   │   │       ├── f_000227
│   │   │   │       ├── f_000228
│   │   │   │       ├── f_000229
│   │   │   │       ├── f_00022a
│   │   │   │       ├── f_00022b
│   │   │   │       ├── f_00022c
│   │   │   │       ├── f_00022d
│   │   │   │       ├── f_00022e
│   │   │   │       ├── f_00022f
│   │   │   │       ├── f_000230
│   │   │   │       ├── f_000231
│   │   │   │       ├── f_000232
│   │   │   │       ├── f_000233
│   │   │   │       ├── f_000234
│   │   │   │       ├── f_000235
│   │   │   │       ├── f_000236
│   │   │   │       ├── f_000237
│   │   │   │       ├── f_000238
│   │   │   │       ├── f_000239
│   │   │   │       ├── f_00023a
│   │   │   │       ├── f_00023b
│   │   │   │       ├── f_00023c
│   │   │   │       ├── f_00023d
│   │   │   │       ├── f_00023e
│   │   │   │       ├── f_00023f
│   │   │   │       ├── f_000240
│   │   │   │       └── index
│   │   │   ├── Code Cache
│   │   │   │   ├── js
│   │   │   │   │   ├── index-dir
│   │   │   │   │   │   └── the-real-index
│   │   │   │   │   ├── 000c2d85205f6b0c_0
│   │   │   │   │   ├── 0489203a21bc07be_0
│   │   │   │   │   ├── 05bfe7a56ac61c23_0
│   │   │   │   │   ├── 07bdaaf751798210_0
│   │   │   │   │   ├── 07fc5f6baf3d02ad_0
│   │   │   │   │   ├── 0806c234488ace53_0
│   │   │   │   │   ├── 0c39646c7e49b73c_0
│   │   │   │   │   ├── 114d9ffc0d263c56_0
│   │   │   │   │   ├── 11e277cb00618aec_0
│   │   │   │   │   ├── 13508ae98f74e3fe_0
│   │   │   │   │   ├── 145a8b90dbc8e030_0
│   │   │   │   │   ├── 1643585c237c5e39_0
│   │   │   │   │   ├── 1678ff6323544acb_0
│   │   │   │   │   ├── 1774dc23fc09d803_0
│   │   │   │   │   ├── 18911c8d92f316c8_0
│   │   │   │   │   ├── 1df2aca295a49d3a_0
│   │   │   │   │   ├── 20a1d2e14f2b622b_0
│   │   │   │   │   ├── 21b3c3f9b229e70d_0
│   │   │   │   │   ├── 23b209367cd257be_0
│   │   │   │   │   ├── 2527763cbd4c56ff_0
│   │   │   │   │   ├── 2d9273ff6c7deccd_0
│   │   │   │   │   ├── 31db7d6e4b2d2fd0_0
│   │   │   │   │   ├── 327fd3a80dd087cf_0
│   │   │   │   │   ├── 328d44915f5e4afd_0
│   │   │   │   │   ├── 342835d29a599525_0
│   │   │   │   │   ├── 38b3f9d6d04c95c5_0
│   │   │   │   │   ├── 3b72c404a29c4a95_0
│   │   │   │   │   ├── 3fc69e49cd1f0ee8_0
│   │   │   │   │   ├── 41622d5f2f89cb25_0
│   │   │   │   │   ├── 42bb6b9d45e2827d_0
│   │   │   │   │   ├── 43c84bfc62f6159c_0
│   │   │   │   │   ├── 43d2b6892be7a904_0
│   │   │   │   │   ├── 46374f1d947d90dc_0
│   │   │   │   │   ├── 4687559032dfbcfd_0
│   │   │   │   │   ├── 46be7538cbe0247c_0
│   │   │   │   │   ├── 4cdcceda763a2596_0
│   │   │   │   │   ├── 4d8dfac84fe3efec_0
│   │   │   │   │   ├── 4ecc3f8008dc2ea4_0
│   │   │   │   │   ├── 5101293a27cdb5cf_0
│   │   │   │   │   ├── 5465a16e37ca213e_0
│   │   │   │   │   ├── 547a150eb38cb896_0
│   │   │   │   │   ├── 554e1f57c1e0a6c0_0
│   │   │   │   │   ├── 55e6e1870850d575_0
│   │   │   │   │   ├── 55ea9d4efa300279_0
│   │   │   │   │   ├── 56a554ffd51c49d1_0
│   │   │   │   │   ├── 5b07112daeeffe26_0
│   │   │   │   │   ├── 5b27eafbd3c07563_0
│   │   │   │   │   ├── 5c19547905f6c150_0
│   │   │   │   │   ├── 5cc73fa240750d94_0
│   │   │   │   │   ├── 604b6f1a4857e406_0
│   │   │   │   │   ├── 63775d21b74dad2a_0
│   │   │   │   │   ├── 64cc3efc39f76658_0
│   │   │   │   │   ├── 674f3f2aa7b7af56_0
│   │   │   │   │   ├── 6c1969ac32974ee2_0
│   │   │   │   │   ├── 6cfd726a390e09c0_0
│   │   │   │   │   ├── 6d33e35b3cac9fb1_0
│   │   │   │   │   ├── 6ddc8911d0d1f69c_0
│   │   │   │   │   ├── 6f89afec77d968f8_0
│   │   │   │   │   ├── 70fc3bcec435c421_0
│   │   │   │   │   ├── 7122bc3530e45970_0
│   │   │   │   │   ├── 72092a9149c642c5_0
│   │   │   │   │   ├── 72efb63fafdf8388_0
│   │   │   │   │   ├── 7824482dc840817c_0
│   │   │   │   │   ├── 7865015323255608_0
│   │   │   │   │   ├── 7b508e9b9fe88147_0
│   │   │   │   │   ├── 7e1ef40c46bb082c_0
│   │   │   │   │   ├── 857bb42d90409d26_0
│   │   │   │   │   ├── 86f3473cee774377_0
│   │   │   │   │   ├── 87f7e16701d5b2e4_0
│   │   │   │   │   ├── 89b04531b0386d55_0
│   │   │   │   │   ├── 8acce6e15f2a7195_0
│   │   │   │   │   ├── 8c074fe0f2c19ed5_0
│   │   │   │   │   ├── 8fd3958a199829c5_0
│   │   │   │   │   ├── 92284a4aae01748a_0
│   │   │   │   │   ├── 94ab7e087845716a_0
│   │   │   │   │   ├── 94c060687e0afae3_0
│   │   │   │   │   ├── 95ee6ab82f8ffb13_0
│   │   │   │   │   ├── 96aafc9bb0d873bd_0
│   │   │   │   │   ├── 9a1c70d8e42fd424_0
│   │   │   │   │   ├── 9a8fb419e87c16ac_0
│   │   │   │   │   ├── 9d91c995994ce003_0
│   │   │   │   │   ├── a1b491367ac01203_0
│   │   │   │   │   ├── a655b4d5ddc33941_0
│   │   │   │   │   ├── a7199ba8e722d0a8_0
│   │   │   │   │   ├── a75fc932a035f984_0
│   │   │   │   │   ├── a82791d8624cbf77_0
│   │   │   │   │   ├── ac06326f05b18177_0
│   │   │   │   │   ├── acf94eefbed746fe_0
│   │   │   │   │   ├── b08724942ee43db4_0
│   │   │   │   │   ├── b0a060e04e36c187_0
│   │   │   │   │   ├── b16141f657bd5638_0
│   │   │   │   │   ├── b70744f898f7b156_0
│   │   │   │   │   ├── b82d5a8e99d70049_0
│   │   │   │   │   ├── b832840f886572d1_0
│   │   │   │   │   ├── b858bbb561b69cbe_0
│   │   │   │   │   ├── b982c96de95507cd_0
│   │   │   │   │   ├── b9ab5c168ab65991_0
│   │   │   │   │   ├── ba5488bf07068107_0
│   │   │   │   │   ├── be26bb8f7edac561_0
│   │   │   │   │   ├── c0deba7e7a2924e1_0
│   │   │   │   │   ├── c254e5d1cb2e98ce_0
│   │   │   │   │   ├── c75dc317bfc445df_0
│   │   │   │   │   ├── cb9cff92c4c2fc69_0
│   │   │   │   │   ├── d2d3cc2e1c64c1bd_0
│   │   │   │   │   ├── da9e96c3f633f5e7_0
│   │   │   │   │   ├── db9f031fce7fc2c6_0
│   │   │   │   │   ├── de6e432cbc5b6a6a_0
│   │   │   │   │   ├── df3d7fbd7e91918d_0
│   │   │   │   │   ├── e0fcec080dd44ea0_0
│   │   │   │   │   ├── e67fa76914635e5e_0
│   │   │   │   │   ├── e8c3e879dae6020f_0
│   │   │   │   │   ├── e9333498b673ca31_0
│   │   │   │   │   ├── e948462bc1327dda_0
│   │   │   │   │   ├── e9dba0dcc0aef1de_0
│   │   │   │   │   ├── f0e4833518b946e4_0
│   │   │   │   │   ├── f2e53246e6473700_0
│   │   │   │   │   ├── f5503d7d06772945_0
│   │   │   │   │   ├── fa6622e9864c4172_0
│   │   │   │   │   ├── fe911316bb1cf323_0
│   │   │   │   │   └── index
│   │   │   │   └── wasm
│   │   │   │       ├── index-dir
│   │   │   │       │   └── the-real-index
│   │   │   │       └── index
│   │   │   ├── databases
│   │   │   │   └── Databases.db
│   │   │   ├── DawnCache
│   │   │   │   ├── data_0
│   │   │   │   ├── data_1
│   │   │   │   ├── data_2
│   │   │   │   ├── data_3
│   │   │   │   └── index
│   │   │   ├── GPUCache
│   │   │   │   ├── data_0
│   │   │   │   ├── data_1
│   │   │   │   ├── data_2
│   │   │   │   ├── data_3
│   │   │   │   └── index
│   │   │   ├── IndexedDB
│   │   │   │   ├── https_web.whatsapp.com_0.indexeddb.blob
│   │   │   │   │   └── 13a
│   │   │   │   │       └── 00
│   │   │   │   │           ├── 3
│   │   │   │   │           └── 4
│   │   │   │   └── https_web.whatsapp.com_0.indexeddb.leveldb
│   │   │   │       ├── 001145.log
│   │   │   │       ├── 001147.ldb
│   │   │   │       ├── 001148.ldb
│   │   │   │       ├── 001149.ldb
│   │   │   │       ├── 001150.ldb
│   │   │   │       ├── 001151.ldb
│   │   │   │       ├── CURRENT
│   │   │   │       ├── LOCK
│   │   │   │       ├── LOG
│   │   │   │       ├── LOG.old
│   │   │   │       └── MANIFEST-000001
│   │   │   ├── Local Storage
│   │   │   │   └── leveldb
│   │   │   │       ├── 000006.ldb
│   │   │   │       ├── 000008.log
│   │   │   │       ├── 000009.ldb
│   │   │   │       ├── CURRENT
│   │   │   │       ├── LOCK
│   │   │   │       ├── LOG
│   │   │   │       ├── LOG.old
│   │   │   │       └── MANIFEST-000001
│   │   │   ├── Service Worker
│   │   │   │   ├── CacheStorage
│   │   │   │   │   └── 0bf6ab7f94a21cdc9c1649f884333ec20f40a544
│   │   │   │   │       ├── 0b5f0753-eb71-46e0-b617-122e2c8cb43b
│   │   │   │   │       │   ├── index-dir
│   │   │   │   │       │   │   └── the-real-index
│   │   │   │   │       │   ├── 10ad042b66988afb_0
│   │   │   │   │       │   ├── 153d1886ac8679af_0
│   │   │   │   │       │   ├── 1fc8a08a37dac25b_0
│   │   │   │   │       │   ├── 27e08f5dbb16daaf_0
│   │   │   │   │       │   ├── 2df7f4f6199654b5_0
│   │   │   │   │       │   ├── 3aa2e55a0a2272a9_0
│   │   │   │   │       │   ├── 400dcc58bd82e957_0
│   │   │   │   │       │   ├── 49f65d40334197cf_0
│   │   │   │   │       │   ├── 5e11506e99e5446e_0
│   │   │   │   │       │   ├── 60867b969130298d_0
│   │   │   │   │       │   ├── 6ea3d4b59192a5f3_0
│   │   │   │   │       │   ├── 6f28ae9f4a6b7f6a_0
│   │   │   │   │       │   ├── 7e012f3012927ccc_0
│   │   │   │   │       │   ├── 91ef166759aad91a_0
│   │   │   │   │       │   ├── a58182346a84bfa7_0
│   │   │   │   │       │   ├── a7326c8f5be7bd50_0
│   │   │   │   │       │   ├── b88d2707aad36d1c_0
│   │   │   │   │       │   ├── bb1e58ce37244e26_0
│   │   │   │   │       │   ├── d5d638677f35b684_0
│   │   │   │   │       │   ├── e56482d8da43f27f_0
│   │   │   │   │       │   └── index
│   │   │   │   │       ├── 87613251-a34f-42e0-aaef-15a38a3f08da
│   │   │   │   │       │   ├── index-dir
│   │   │   │   │       │   │   └── the-real-index
│   │   │   │   │       │   ├── 2a2b7cbbc61290b4_0
│   │   │   │   │       │   ├── 6ea66fa5b36b4157_0
│   │   │   │   │       │   ├── 92172a9e586cee2a_0
│   │   │   │   │       │   ├── e6039a61e4d2a504_0
│   │   │   │   │       │   └── index
│   │   │   │   │       ├── a4222239-2ea2-4919-8426-8835b1bb75f5
│   │   │   │   │       │   ├── index-dir
│   │   │   │   │       │   │   └── the-real-index
│   │   │   │   │       │   ├── 05d6dede86e42782_0
│   │   │   │   │       │   ├── 07b3f7510434c01f_0
│   │   │   │   │       │   ├── 154d09f163e2e3a3_0
│   │   │   │   │       │   ├── 17906b9c298abda6_0
│   │   │   │   │       │   ├── 18b1ef1b883e6726_0
│   │   │   │   │       │   ├── 197da05fa1fe9be9_0
│   │   │   │   │       │   ├── 1ad15cb064d3ffc1_0
│   │   │   │   │       │   ├── 24e600649a3e4844_0
│   │   │   │   │       │   ├── 2a2737e9ca13299d_0
│   │   │   │   │       │   ├── 2e5bcaf14ed7b146_0
│   │   │   │   │       │   ├── 2f16e1826af031c8_0
│   │   │   │   │       │   ├── 339b0f5f7bdfeed9_0
│   │   │   │   │       │   ├── 38a0c22ec2805790_0
│   │   │   │   │       │   ├── 3a84d66346496cfc_0
│   │   │   │   │       │   ├── 3ceb386fa7799c70_0
│   │   │   │   │       │   ├── 4e0014721051ad94_0
│   │   │   │   │       │   ├── 4f53a8466826d5f2_0
│   │   │   │   │       │   ├── 577bec6b0fc5d476_0
│   │   │   │   │       │   ├── 586d68a47c270096_0
│   │   │   │   │       │   ├── 6186f3a8fd33b153_0
│   │   │   │   │       │   ├── 67410841a417003e_0
│   │   │   │   │       │   ├── 7f904fa41af36a67_0
│   │   │   │   │       │   ├── 8086f18121b2afdf_0
│   │   │   │   │       │   ├── 81a78c6ef5edd744_0
│   │   │   │   │       │   ├── 82ff0a14494704bc_0
│   │   │   │   │       │   ├── 83cd97c25fea694a_0
│   │   │   │   │       │   ├── 83d5d3a87467eb30_0
│   │   │   │   │       │   ├── 85baccb76912982c_0
│   │   │   │   │       │   ├── 8838d328d8fb91d4_0
│   │   │   │   │       │   ├── 8b32300e3fb258d8_0
│   │   │   │   │       │   ├── 8bbd516abd541a6a_0
│   │   │   │   │       │   ├── 90cec0a1066d850a_0
│   │   │   │   │       │   ├── 915852632b1dea22_0
│   │   │   │   │       │   ├── 97d369136b95a4ad_0
│   │   │   │   │       │   ├── 9afc3551defa1711_0
│   │   │   │   │       │   ├── 9cb7b5b9fed60322_0
│   │   │   │   │       │   ├── ae5d03037a0a5ae8_0
│   │   │   │   │       │   ├── b15859796bdf15df_0
│   │   │   │   │       │   ├── b4fea60586604bc4_0
│   │   │   │   │       │   ├── b86a9ee8d8244e0f_0
│   │   │   │   │       │   ├── b9f95f7349281e4f_0
│   │   │   │   │       │   ├── ba97adabfd575cc7_0
│   │   │   │   │       │   ├── bac6da0cce8a7449_0
│   │   │   │   │       │   ├── bf65de8d49a3f4a0_0
│   │   │   │   │       │   ├── c0a42ae1a1536f33_0
│   │   │   │   │       │   ├── d1ea86ac986c53bc_0
│   │   │   │   │       │   ├── d2684843334e2c12_0
│   │   │   │   │       │   ├── d4c57068aa28a713_0
│   │   │   │   │       │   ├── d6c9d6b241462bfe_0
│   │   │   │   │       │   ├── da4a5cc405aa4d04_0
│   │   │   │   │       │   ├── e787e2be5d3c7989_0
│   │   │   │   │       │   ├── ebe28b1fe785818e_0
│   │   │   │   │       │   ├── fe64dc7b1fcc3ec4_0
│   │   │   │   │       │   └── index
│   │   │   │   │       └── index.txt
│   │   │   │   ├── Database
│   │   │   │   │   ├── 000003.log
│   │   │   │   │   ├── CURRENT
│   │   │   │   │   ├── LOCK
│   │   │   │   │   ├── LOG
│   │   │   │   │   ├── LOG.old
│   │   │   │   │   └── MANIFEST-000001
│   │   │   │   └── ScriptCache
│   │   │   │       ├── index-dir
│   │   │   │       │   └── the-real-index
│   │   │   │       ├── 013888a1cda32b90_0
│   │   │   │       ├── 013888a1cda32b90_1
│   │   │   │       ├── b6c28cea6ed9dfc1_0
│   │   │   │       ├── b6c28cea6ed9dfc1_1
│   │   │   │       └── index
│   │   │   ├── Session Storage
│   │   │   │   ├── 000003.log
│   │   │   │   ├── CURRENT
│   │   │   │   ├── LOCK
│   │   │   │   ├── LOG
│   │   │   │   ├── LOG.old
│   │   │   │   └── MANIFEST-000001
│   │   │   ├── shared_proto_db
│   │   │   │   ├── metadata
│   │   │   │   │   ├── 000003.log
│   │   │   │   │   ├── CURRENT
│   │   │   │   │   ├── LOCK
│   │   │   │   │   ├── LOG
│   │   │   │   │   └── MANIFEST-000001
│   │   │   │   ├── 000003.log
│   │   │   │   ├── CURRENT
│   │   │   │   ├── LOCK
│   │   │   │   ├── LOG
│   │   │   │   └── MANIFEST-000001
│   │   │   ├── VideoDecodeStats
│   │   │   │   ├── LOCK
│   │   │   │   └── LOG
│   │   │   ├── WebStorage
│   │   │   │   ├── QuotaManager
│   │   │   │   └── QuotaManager-journal
│   │   │   ├── chrome_debug.log
│   │   │   ├── Cookies
│   │   │   └── Cookies-journal
│   │   └── DevToolsActivePort
│   └── session-ventzas-mx
│       └── Default
│           ├── Cache
│           │   └── Cache_Data
│           │       ├── data_0
│           │       ├── data_1
│           │       ├── data_2
│           │       ├── data_3
│           │       └── index
│           ├── databases
│           │   └── Databases.db
│           ├── DawnCache
│           │   ├── data_0
│           │   ├── data_1
│           │   ├── data_2
│           │   ├── data_3
│           │   └── index
│           ├── GPUCache
│           │   ├── data_0
│           │   ├── data_1
│           │   ├── data_2
│           │   ├── data_3
│           │   └── index
│           ├── IndexedDB
│           │   └── https_web.whatsapp.com_0.indexeddb.leveldb
│           │       ├── 000060.ldb
│           │       ├── 000092.ldb
│           │       ├── 000093.log
│           │       ├── 000095.ldb
│           │       ├── LOCK
│           │       ├── LOG
│           │       └── MANIFEST-000001
│           ├── Local Storage
│           │   └── leveldb
│           │       ├── 000003.log
│           │       ├── LOCK
│           │       ├── LOG
│           │       └── MANIFEST-000001
│           ├── Service Worker
│           │   └── Database
│           │       ├── 000003.log
│           │       ├── LOCK
│           │       ├── LOG
│           │       └── MANIFEST-000001
│           ├── Session Storage
│           │   ├── 000003.log
│           │   ├── LOCK
│           │   ├── LOG
│           │   └── MANIFEST-000001
│           ├── WebStorage
│           │   ├── QuotaManager
│           │   └── QuotaManager-journal
│           ├── chrome_debug.log
│           └── Cookies
├── .wwebjs_cache
│   ├── 2.3000.1029956502.html
│   ├── 2.3000.1029974494.html
│   ├── 2.3000.1029982878.html
│   ├── 2.3000.1029992881.html
│   ├── 2.3000.1030021858.html
│   ├── 2.3000.1030047599.html
│   ├── 2.3000.1030056828.html
│   ├── 2.3000.1030118877.html
│   ├── 2.3000.1030128180.html
│   ├── 2.3000.1030132888.html
│   ├── 2.3000.1030140816.html
│   ├── 2.3000.1030155595.html
│   └── 2.3000.1030174625.html
├── auth
│   ├── authController.js
│   ├── authMiddleware.js
│   └── passport.js
├── auth-sessions
│   ├── 10023291230
│   ├── 2734545
│   ├── Chachi-bot
│   └── ventas-mx
├── client
│   ├── dist
│   │   ├── assets
│   │   │   ├── Dashboard-BysEErda.js
│   │   │   ├── Dashboard-BysEErda.js.map
│   │   │   ├── Helmet-BZx-QukC.js
│   │   │   ├── Helmet-BZx-QukC.js.map
│   │   │   ├── index-77NWiV7n.css
│   │   │   ├── index-B5_4hEsZ.js
│   │   │   ├── index-B5_4hEsZ.js.map
│   │   │   ├── Login-BDyWgnef.js
│   │   │   ├── Login-BDyWgnef.js.map
│   │   │   ├── logo-Bo1ZP4vQ.png
│   │   │   ├── PrivacyPortal-DXCrOdym.js
│   │   │   ├── PrivacyPortal-DXCrOdym.js.map
│   │   │   ├── SalesPanelEnhanced-uQSBYsc0.js
│   │   │   └── SalesPanelEnhanced-uQSBYsc0.js.map
│   │   ├── index.html
│   │   └── vite.svg
│   ├── public
│   │   └── vite.svg
│   ├── src
│   │   ├── assets
│   │   │   ├── logo.png
│   │   │   └── react.svg
│   │   ├── components
│   │   │   ├── atoms
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Icon.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   └── Typography.jsx
│   │   │   ├── molecules
│   │   │   ├── organisms
│   │   │   │   ├── AnalyzedChatsGrid.jsx
│   │   │   │   ├── ChatDetailsPanel.jsx
│   │   │   │   └── KanbanPipeline.jsx
│   │   │   ├── templates
│   │   │   ├── BotCard.jsx
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── Icons.jsx
│   │   │   ├── LanguageSwitcher.jsx
│   │   │   ├── LeadScoreCard.jsx
│   │   │   ├── PipelineBoard.jsx
│   │   │   ├── PipelineBoardEnhanced.jsx
│   │   │   ├── ProductManager.jsx
│   │   │   ├── ScoringRulesManager.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── SubscriptionStatus.jsx
│   │   │   └── WebChatWidget.jsx
│   │   ├── context
│   │   │   ├── AuthContext.jsx
│   │   │   ├── BotsContext.jsx
│   │   │   └── UIContext.jsx
│   │   ├── locales
│   │   │   ├── en
│   │   │   │   └── translation.json
│   │   │   └── es
│   │   │       └── translation.json
│   │   ├── pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── PrivacyPortal.jsx
│   │   │   ├── SalesPanel.jsx
│   │   │   └── SalesPanelEnhanced.jsx
│   │   ├── utils
│   │   │   └── api.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── i18n.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── README.md
│   ├── tailwind.config.js
│   └── vite.config.js
├── controllers
│   ├── complianceController.js
│   ├── sseController.js
│   └── webhookController.js
├── data
│   ├── migrations
│   │   └── 001_add_subscription_fields.js
│   ├── bots.db
│   ├── history_botito.db
│   ├── history_soldabot.db
│   ├── history_ventas-mx.db
│   ├── history_ventzas-mx.db
│   ├── leads.db
│   └── scheduler.db
├── dist
│   ├── assets
│   │   ├── index-BFicSp6f.css
│   │   └── index-CnmjQMYZ.js
│   ├── index.html
│   ├── landing.css
│   ├── logo.png
│   └── style.css
├── docs
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── BACKUP_STRATEGY.md
│   ├── COMPLETE_DOCUMENTATION.md
│   ├── CONTRIBUTING.md
│   ├── CRM_SPECIFICATION.md
│   ├── DATA_INTEGRITY_IMPLEMENTATION_SUMMARY.md
│   ├── DESIGN_SYSTEM.md
│   ├── EXAMPLES.md
│   ├── IMPLEMENTATION_PHASE1.md
│   ├── IMPLEMENTATION_STATUS.md
│   ├── LEAD_SCORING.md
│   ├── planDeArquitectura.md
│   └── SAAS_ARCHITECTURE.md
├── middleware
│   ├── quotaMiddleware.js
│   ├── tenantMiddleware.js
│   └── validationMiddleware.js
├── migrations
│   ├── 001_add_scoring.sql
│   ├── 002_add_products.sql
│   ├── 003_add_is_qualified.sql
│   ├── 004_add_product_images.sql
│   ├── 005_add_product_image_storage_key.sql
│   ├── 006_multi_tenant_init.sql
│   ├── 007_auth_helpers.sql
│   ├── 008_fix_port_allocation.sql
│   ├── 009_ai_personalization.sql
│   ├── 010_crm_pipelines.sql
│   ├── 011_add_missing_foreign_keys.sql
│   ├── 012_standardize_uuid_ids.sql
│   ├── 013_analyzed_chats_system_fixed.sql
│   ├── 013_analyzed_chats_system.sql
│   ├── 014_bot_sessions_persistence.sql
│   ├── 015_bot_auth_store.sql
│   ├── 016_increase_phone_column_size.sql
│   └── 017_fix_bot_sessions_tenant.sql
├── public
│   ├── landing.css
│   ├── logo.png
│   └── style.css
├── routes
│   ├── analyticsRoutes.js
│   ├── analyzedChatsRoutes.js
│   ├── authRoutes.js
│   ├── complianceRoutes.js
│   ├── dataIntegrityRoutes.js
│   ├── leadRoutes.js
│   ├── subscriptionRoutes.js
│   └── webChatRoutes.js
├── scripts
│   ├── auto-analyze-chats.js
│   ├── backup-database.js
│   ├── cleanup-old-data.js
│   ├── cron-analyze.js
│   ├── diagnose-chats.js
│   ├── initialize-phase1.js
│   └── seed_local.js
├── services
│   ├── data
│   │   └── bots.db
│   ├── analyticsService.js
│   ├── baileysAuthService.js
│   ├── baileysManager.js
│   ├── botConfigService.js
│   ├── botDbService.js
│   ├── botImageService.js
│   ├── bulkAnalysisService.js
│   ├── chatAnalysisService.js
│   ├── chatSyncService.js
│   ├── complianceAlertsService.js
│   ├── complianceService.js
│   ├── dataIntegrityMonitor.js
│   ├── db.js
│   ├── deepseekService.js
│   ├── emailAutomationService.js
│   ├── exportService.js
│   ├── initDb.js
│   ├── leadDbService.js
│   ├── leadExtractionService.js
│   ├── pipelineService.js
│   ├── predictiveEngineService.js
│   ├── productService.js
│   ├── schedulerExecutor.js
│   ├── schedulerService.js
│   ├── scoringService.js
│   ├── sessionPersistenceService.js
│   ├── statsService.js
│   ├── storageService.js
│   ├── subscriptionService.js
│   ├── transactionUtils.js
│   └── userService.js
├── session-backups
├── .env
├── .env.example
├── .gitignore
├── Casos de éxito que hablan por sí solos - botinteligente.html
├── CHANGELOG.md
├── fix-missing-function.js
├── generate_structure.js
├── index.html
├── LICENSE
├── migrate.js
├── next.config.js
├── nixpacks.toml
├── package-lock.json
├── package.json
├── postcss.config.js
├── PROJECT_STRUCTURE.md
├── railway.json
├── README.md
├── reset-database.js
├── run_migration.js
├── run_postgres_migration.js
├── seed-pipeline-categories.sql
├── server.js
├── setup-analyzed-chats.sh
├── tailwind.config.js
├── test_baileys_connection.js
├── test_comprehensive_system.js
├── test_frontend_backend.js
├── test_session_persistence.js
├── test_start.js
├── test_tenant_logic.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```
