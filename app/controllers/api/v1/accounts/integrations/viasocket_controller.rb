class Api::V1::Accounts::Integrations::ViasocketController < Api::V1::Accounts::BaseController
  before_action :check_admin_authorization?

  def embed_token
    access_key = ENV.fetch('VIASOCKET_ACCESS_KEY', nil)
    payload = fetch_payload
    plugin_data = fetch_plugin_data
    token = JWT.encode payload, access_key, 'HS256'
    service_data = encrypt_message(plugin_data.to_json, access_key)
    render json: { success: true, token: token, service_data: service_data }
  end

  private

  def fetch_payload
    {
      org_id: ENV.fetch('VIASOCKET_ORG_ID', nil),
      project_id: ENV.fetch('VIASOCKET_PROJECT_ID', nil),
      user_id: Current.account.id
    }
  end

  def encrypt_message(message, key)
    # Generate random salt and initialization vector (IV)
    salt = OpenSSL::Random.random_bytes(16)
    iv = OpenSSL::Random.random_bytes(16)

    # Derive key using PBKDF2
    iter = 100_000
    key_len = 32
    key_bytes = OpenSSL::KDF.pbkdf2_hmac(key, salt: salt, iterations: iter, length: key_len, hash: 'SHA256')

    # Encrypt the message
    cipher = OpenSSL::Cipher.new('aes-256-cfb')
    cipher.encrypt
    cipher.key = key_bytes
    cipher.iv = iv
    encrypted = cipher.update(message) + cipher.final

    # Combine the salt, IV, and encrypted message into a single string
    result = salt + iv + encrypted
    Base64.encode64(result)
  end

  def fetch_plugin_data
    access_token = params[:access_token]
    {
      'row6wygck03d': {
        'key': 'Custom_Action',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'row622cmmk38': {
        'key': 'Create_a_Contact',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rown6z2kbw0v': {
        'key': 'Get_all_Contacts',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'row6c6mg8ukz': {
        'key': 'Get_a_Contact',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowd4vt1utyf': {
        'key': 'Delete_a_Contact',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowdejjhdh7p': {
        'key': 'Update_a_Contact',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'row2exoi88ws': {
        'key': 'Get_all_Conversations_Details',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowfqzsctz4p': {
        'key': 'Get_Conversation_Counts',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowox8zoyw33': {
        'key': 'Create_a_Team',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowv2t1hp5ea': {
        'key': 'Get_all_Teams',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowm55s9pmjt': {
        'key': 'Update_a_Team',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowo18xwmf6w': {
        'key': 'List_Agents_in_Team',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowwxye75c6s': {
        'key': 'Get_all_Messages',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowz9fnajhcx': {
        'key': 'Delete_a_Message',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowejade3q7g': {
        'key': 'Add_Labels',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowway1pnx7c': {
        'key': 'Get_all_Labels',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'row1iq39j45g': {
        'key': 'Add_a_New_Agent',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowicvdzvh9y': {
        'key': 'List_Agents_in_Account',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowlpiq5qbtn': {
        'key': 'Update_a_Agent_in_Account',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowgccvkgxpf': {
        'key': 'Delete_an_Agent_from_Account',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'row5amjuvl0n': {
        'key': 'Get_a_Automation_Rule_Details',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowydpjixyik': {
        'key': 'List_all_Automation_Rules',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'row72yd2ethi': {
        'key': 'Delete_a_Automation_Rule',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowbhvd2jl3w': {
        'key': 'New_Message_is_Created',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowmj7ecaux8': {
        'key': 'New_Conversation_is_Created',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowbpna0x5s2': {
        'key': 'Conversation_is_Updated',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      },
      'rowiumaagauf': {
        'key': 'Conversation_Status_is_Changed',
        'inputValues': {},
        'authValues': {
          'access_token': access_token
        }
      }
    }
  end
end
