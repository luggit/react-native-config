#!/usr/bin/env ruby
# frozen_string_literal: true

# Allow utf-8 charactor in config value
# For example, APP_NAME=中文字符
Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8

# TODO: introduce a parameter which controls how to build relative path
def read_dot_env(envs_root)
  defaultEnvFile = '.env'
  localEnvFile = '.env.local'
  puts "going to read env file from root folder #{envs_root}"

  # pick a custom env file if set
  if File.exist?('/tmp/envfile')
    custom_env = true
    file = File.read('/tmp/envfile').strip
  else
    custom_env = false
    file = ENV['ENVFILE'] || defaultEnvFile
  end

  if File.exists?("/tmp/useenvlocal")
    useLocalEnv = true
  else
    useLocalEnv = ENV["USE_ENV_LOCAL_CONFIG"] || false
  end

  dotenv = begin
    # https://regex101.com/r/cbm5Tp/1
    dotenv_pattern = /^(?:export\s+|)(?<key>[[:alnum:]_]+)\s*=\s*((?<quote>["'])?(?<val>.*?[^\\])\k<quote>?|)$/

    path = File.expand_path(File.join(envs_root, file.to_s))
    if File.exist?(path)
      raw = File.read(path)
    elsif File.exist?(file)
      raw = File.read(file)
    else
      defaultEnvPath = File.expand_path(File.join(envs_root, "#{defaultEnvFile}"))
      unless File.exist?(defaultEnvPath)
        # try as absolute path
        defaultEnvPath = defaultEnvFile
      end
      raw = File.read(defaultEnvPath)
    end

    parsed = raw.split("\n").inject({}) do |h, line|
      m = line.match(dotenv_pattern)

      next h if line.nil? || line.strip.empty?
      next h if line.match(/^\s*#/)

      if m.nil?
        abort('Invalid entry in .env file. Please verify your .env file is correctly formatted.')
      end

      key = m[:key]
      # Ensure string (in case of empty value) and escape any quotes present in the value.
      val = m[:val].to_s.gsub('"', '\"')
      h.merge(key => val)
    end

    if useLocalEnv
      localPath = File.expand_path(File.join(envs_root, localEnvFile.to_s))
      if File.exists?(localPath)
        localRaw = File.read(localPath)
      elsif File.exist?(localEnvFile)
        raw = File.read(localEnvFile)
      else
        localRaw = "\n"
      end

      parsed = localRaw.split("\n").inject(parsed) do |h, line|
        m = line.match(dotenv_pattern)
        
        next h if line.nil? || line.strip.empty?
        next h if line.match(/^\s*#/)

        if m.nil?
          abort('Invalid entry in .env file. Please verify your .env file is correctly formatted.')
        end

        key = m[:key]
        # Ensure string (in case of empty value) and escape any quotes present in the value.
        val = m[:val].to_s.gsub('"', '\"')
        h.merge(key => val)
      end
    end
    parsed
    rescue Errno::ENOENT
      puts('**************************')
      puts('*** Missing .env file ****')
      puts('**************************')
      return [{}, false] # set dotenv as an empty hash
  end
  [dotenv, custom_env]
end
