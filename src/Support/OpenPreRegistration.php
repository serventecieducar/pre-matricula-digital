<?php

namespace iEducar\Packages\PreMatricula\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class OpenPreRegistration
{
    public static function url(): ?string
    {
        $abertos = self::abertos();

        return $abertos === [] ? null : $abertos[0]['url'];
    }

    /**
     * @return list<array{rotulo: string, url: string}>
     */
    public static function abertos(): array
    {
        try {
            if (!Schema::hasTable('processes') || !Schema::hasTable('process_stages')) {
                return [];
            }

            $linhas = DB::table('process_stages as s')
                ->join('processes as p', 'p.id', '=', 's.process_id')
                ->where('p.active', true)
                ->where('s.start_at', '<', now())
                ->where('s.end_at', '>', now())
                ->orderBy('p.name')
                ->orderBy('s.name')
                ->get(['p.name as processo', 's.id as etapa_id', 's.name as etapa_nome']);
        } catch (\Throwable) {
            return [];
        }

        $lista = [];

        foreach ($linhas as $linha) {
            $lista[] = [
                'rotulo' => $linha->processo . ' — ' . $linha->etapa_nome,
                'url' => url('/pre-matricula-digital/inscricao/' . $linha->etapa_id),
            ];
        }

        return $lista;
    }
}
