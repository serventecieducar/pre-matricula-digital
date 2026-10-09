@php
    $processosAbertos = \iEducar\Packages\PreMatricula\Support\OpenPreRegistration::abertos();
@endphp
@if($processosAbertos !== [])
    <div class="processos-abertos">
        <span class="processos-abertos-titulo">Processos abertos</span>
        @foreach($processosAbertos as $processo)
            <a class="pre-registration" href="{{ $processo['url'] }}">
                <i class="fa fa-pencil-square-o" aria-hidden="true"></i>
                {{ $processo['rotulo'] }}
            </a>
        @endforeach
    </div>
@endif
<style>
    .processos-abertos {
        flex: 1 1 100%;
        display: grid;
        gap: 8px;
    }
    .processos-abertos-titulo {
        font-size: 13px;
        font-weight: 700;
        color: #334155;
    }
    .processos-abertos a.pre-registration {
        width: 100%;
        box-sizing: border-box;
        background: #0f6e78;
        color: #fff;
        font-weight: 700;
        text-decoration: none;
        border-radius: 3px;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 16px;
    }
    .processos-abertos a.pre-registration:hover,
    .processos-abertos a.pre-registration:focus {
        background: #0b555d;
        color: #fff;
    }
</style>
